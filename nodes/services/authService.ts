import { IRequestOptions, NodeOperationError } from 'n8n-workflow';
import { SprykerCredentials, SprykerTokenResponse, SprykerTokenCache, SprykerExecutionContext } from '../types';

/**
 * Spryker Authentication Service
 * 
 * Handles OAuth2-like authentication with Spryker Glue API including:
 * - Automatic token management and caching
 * - Token refresh with fallback to new authentication
 * - Redirect handling (HTTPS to HTTP and vice versa)
 * - Comprehensive error handling and retry logic
 * - Cache management utilities
 */
export class SprykerAuthService {
	private context: SprykerExecutionContext;
	private itemIndex: number;
	private static tokenCache: Map<string, SprykerTokenCache> = new Map();
	private static readonly TOKEN_SAFETY_MARGIN = 60000; // 1 minute safety margin
	private static readonly MAX_RETRY_ATTEMPTS = 3;

	constructor(context: SprykerExecutionContext, itemIndex: number) {
		this.context = context;
		this.itemIndex = itemIndex;
	}

	/**
	 * Get a valid access token with enhanced retry logic and error handling
	 */
	async getValidAccessToken(): Promise<string> {
		const credentials = await this.getValidatedCredentials();
		const cacheKey = this.getCacheKey(credentials);
		
		// Try to get a valid token with retry logic
		for (let attempt = 1; attempt <= SprykerAuthService.MAX_RETRY_ATTEMPTS; attempt++) {
			try {
				const cachedToken = SprykerAuthService.tokenCache.get(cacheKey);

				// Return cached token if still valid
				if (cachedToken && this.isTokenValid(cachedToken)) {
					return cachedToken.accessToken;
				}

				// Try to refresh token if available
				if (cachedToken?.refreshToken && this.shouldTryRefresh(cachedToken)) {
					try {
						return await this.refreshAccessToken(credentials, cachedToken.refreshToken);
					} catch (refreshError) {
						console.warn(`Token refresh failed (attempt ${attempt}):`, refreshError.message);
						// Clear invalid cached token
						SprykerAuthService.tokenCache.delete(cacheKey);
					}
				}

				// Get new token
				return await this.getNewAccessToken(credentials);

			} catch (error) {
				if (attempt === SprykerAuthService.MAX_RETRY_ATTEMPTS) {
					throw new NodeOperationError(
						this.context.getNode(),
						`Authentication failed after ${SprykerAuthService.MAX_RETRY_ATTEMPTS} attempts: ${error.message}`,
						{ itemIndex: this.itemIndex }
					);
				}
				
				// Wait before retry (exponential backoff)
				await this.delay(Math.pow(2, attempt - 1) * 1000);
			}
		}

		throw new NodeOperationError(
			this.context.getNode(),
			'Authentication failed: Maximum retry attempts exceeded',
			{ itemIndex: this.itemIndex }
		);
	}

	/**
	 * Get and validate credentials
	 */
	private async getValidatedCredentials(): Promise<SprykerCredentials> {
		const credentials = await this.context.getCredentials('sprykerApi') as SprykerCredentials;
		
		if (!credentials) {
			throw new NodeOperationError(
				this.context.getNode(),
				'No credentials provided. Please configure Spryker API credentials.',
				{ itemIndex: this.itemIndex }
			);
		}

		const missingFields = [];
		if (!credentials.username) missingFields.push('username');
		if (!credentials.password) missingFields.push('password');
		if (!credentials.baseUrl) missingFields.push('baseUrl');

		if (missingFields.length > 0) {
			throw new NodeOperationError(
				this.context.getNode(),
				`Missing required credential fields: ${missingFields.join(', ')}`,
				{ itemIndex: this.itemIndex }
			);
		}

		// Validate baseUrl format
		try {
			new URL(credentials.baseUrl);
		} catch {
			throw new NodeOperationError(
				this.context.getNode(),
				'Invalid baseUrl format. Please provide a valid URL (e.g., https://glue.eu.spryker.local)',
				{ itemIndex: this.itemIndex }
			);
		}

		return credentials;
	}

	/**
	 * Get a new access token using username and password
	 */
	private async getNewAccessToken(credentials: SprykerCredentials): Promise<string> {
		const requestOptions: IRequestOptions = {
			method: 'POST',
			uri: `${credentials.baseUrl.replace(/\/$/, '')}/access-tokens`,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				data: {
					type: 'access-tokens',
					attributes: {
						username: credentials.username,
						password: credentials.password,
					},
				},
			},
			json: true,
			timeout: 30000, // 30 second timeout
			followRedirect: true, // Follow redirects (e.g., HTTPS to HTTP)
			maxRedirects: 5, // Limit redirects to prevent infinite loops
			// @ts-ignore
			tls: {
				rejectUnauthorized: false,
			},
		};

		try {
			const response: SprykerTokenResponse = await this.context.helpers.request(requestOptions);
			
			if (!this.isValidTokenResponse(response)) {
				throw new Error('Invalid token response format from Spryker API');
			}

			const tokenData = response.data.attributes;
			const expiresAt = Date.now() + (tokenData.expiresIn * 1000) - SprykerAuthService.TOKEN_SAFETY_MARGIN;

			// Cache the token
			const cacheKey = this.getCacheKey(credentials);
			SprykerAuthService.tokenCache.set(cacheKey, {
				accessToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				expiresAt,
			});

			return tokenData.accessToken;
		} catch (error) {
			// Provide more specific error messages
			if (error.statusCode === 401) {
				throw new NodeOperationError(
					this.context.getNode(),
					'Invalid username or password',
					{ itemIndex: this.itemIndex }
				);
			} else if (error.statusCode === 404) {
				throw new NodeOperationError(
					this.context.getNode(),
					'Spryker API endpoint not found. Please check your baseUrl',
					{ itemIndex: this.itemIndex }
				);
			} else if (error.statusCode === 307 || error.statusCode === 308) {
				throw new NodeOperationError(
					this.context.getNode(),
					'Server is redirecting the request. If using HTTPS, try HTTP instead (or vice versa)',
					{ itemIndex: this.itemIndex }
				);
			} else if (error.code === 'ECONNREFUSED') {
				throw new NodeOperationError(
					this.context.getNode(),
					'Cannot connect to Spryker API. Please check your baseUrl and network connection',
					{ itemIndex: this.itemIndex }
				);
			} else if (error.code === 'ETIMEDOUT') {
				throw new NodeOperationError(
					this.context.getNode(),
					'Request timeout. Spryker API is not responding',
					{ itemIndex: this.itemIndex }
				);
			} else if (error.message && error.message.includes('Unexpected token')) {
				throw new NodeOperationError(
					this.context.getNode(),
					'Received HTML instead of JSON. This usually indicates a redirect or proxy issue. Check your baseUrl protocol (HTTP vs HTTPS)',
					{ itemIndex: this.itemIndex }
				);
			}
			
			throw new NodeOperationError(
				this.context.getNode(),
				`Failed to get access token: ${error.message}`,
				{ itemIndex: this.itemIndex }
			);
		}
	}

	/**
	 * Refresh an existing access token using the refresh token
	 */
	private async refreshAccessToken(credentials: SprykerCredentials, refreshToken: string): Promise<string> {
		const requestOptions: IRequestOptions = {
			method: 'POST',
			uri: `${credentials.baseUrl.replace(/\/$/, '')}/refresh-tokens`,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				data: {
					type: 'refresh-tokens',
					attributes: {
						refreshToken,
					},
				},
			},
			json: true,
			timeout: 30000, // 30 second timeout
			followRedirect: true, // Follow redirects (e.g., HTTPS to HTTP)
			maxRedirects: 5, // Limit redirects to prevent infinite loops
			// @ts-ignore
			tls: {
				rejectUnauthorized: false,
			},
		};

		try {
			const response: SprykerTokenResponse = await this.context.helpers.request(requestOptions);
			
			if (!this.isValidTokenResponse(response)) {
				throw new Error('Invalid refresh token response format from Spryker API');
			}

			const tokenData = response.data.attributes;
			const expiresAt = Date.now() + (tokenData.expiresIn * 1000) - SprykerAuthService.TOKEN_SAFETY_MARGIN;

			// Update the cache with new token
			const cacheKey = this.getCacheKey(credentials);
			SprykerAuthService.tokenCache.set(cacheKey, {
				accessToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				expiresAt,
			});

			return tokenData.accessToken;
		} catch (error) {
			// Remove invalid cached token
			const cacheKey = this.getCacheKey(credentials);
			SprykerAuthService.tokenCache.delete(cacheKey);
			
			if (error.statusCode === 401) {
				throw new Error('Refresh token is invalid or expired');
			}
			
			throw new Error(`Failed to refresh access token: ${error.message}`);
		}
	}

	/**
	 * Validate token response structure
	 */
	private isValidTokenResponse(response: any): response is SprykerTokenResponse {
		return response?.data?.attributes?.accessToken && 
			   response?.data?.attributes?.refreshToken &&
			   typeof response.data.attributes.expiresIn === 'number';
	}

	/**
	 * Check if a cached token is still valid
	 */
	private isTokenValid(tokenCache: SprykerTokenCache): boolean {
		return Date.now() < tokenCache.expiresAt;
	}

	/**
	 * Check if we should try to refresh the token (not expired but close to expiring)
	 */
	private shouldTryRefresh(tokenCache: SprykerTokenCache): boolean {
		const timeUntilExpiry = tokenCache.expiresAt - Date.now();
		return timeUntilExpiry < (5 * 60 * 1000); // Refresh if less than 5 minutes remaining
	}

	/**
	 * Generate a cache key for the credentials
	 */
	private getCacheKey(credentials: SprykerCredentials): string {
		return `${credentials.baseUrl}:${credentials.username}`;
	}

	/**
	 * Delay function for retry logic
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Clear cached tokens (useful for testing or manual refresh)
	 */
	static clearTokenCache(): void {
		SprykerAuthService.tokenCache.clear();
	}

	/**
	 * Clear specific user's cached token
	 */
	static clearUserTokenCache(baseUrl: string, username: string): void {
		const cacheKey = `${baseUrl}:${username}`;
		SprykerAuthService.tokenCache.delete(cacheKey);
	}

	/**
	 * Get cached token info for debugging
	 */
	static getCachedTokenInfo(baseUrl: string, username: string): SprykerTokenCache | undefined {
		return SprykerAuthService.tokenCache.get(`${baseUrl}:${username}`);
	}

	/**
	 * Get cache statistics for monitoring
	 */
	static getCacheStats(): { totalCachedTokens: number; validTokens: number; expiredTokens: number } {
		const now = Date.now();
		let validTokens = 0;
		let expiredTokens = 0;

		for (const tokenCache of SprykerAuthService.tokenCache.values()) {
			if (now < tokenCache.expiresAt) {
				validTokens++;
			} else {
				expiredTokens++;
			}
		}

		return {
			totalCachedTokens: SprykerAuthService.tokenCache.size,
			validTokens,
			expiredTokens,
		};
	}

	/**
	 * Clean up expired tokens from cache
	 */
	static cleanupExpiredTokens(): number {
		const now = Date.now();
		let removedCount = 0;

		for (const [key, tokenCache] of SprykerAuthService.tokenCache.entries()) {
			if (now >= tokenCache.expiresAt) {
				SprykerAuthService.tokenCache.delete(key);
				removedCount++;
			}
		}

		return removedCount;
	}
}
