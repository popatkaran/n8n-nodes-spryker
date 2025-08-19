import { SprykerAuthService } from '../authService';
import { SprykerCredentials, SprykerExecutionContext, SprykerTokenResponse } from '../../types';

// Mock the n8n-workflow module
jest.mock('n8n-workflow', () => ({
	NodeOperationError: class extends Error {
		constructor(node: any, message: string, options?: any) {
			super(message);
			this.name = 'NodeOperationError';
		}
	},
}));

describe('SprykerAuthService', () => {
	let mockContext: SprykerExecutionContext;
	let authService: SprykerAuthService;
	let mockCredentials: SprykerCredentials;

	beforeEach(() => {
		// Clear token cache before each test
		SprykerAuthService.clearTokenCache();

		mockCredentials = {
			
			username: 'test@example.com',
			password: 'password123',
			baseUrl: 'https://glue.eu.spryker.local',
		};

		mockContext = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue(mockCredentials),
			helpers: {
				request: jest.fn(),
			},
			getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
		};

		authService = new SprykerAuthService(mockContext, 0);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getValidAccessToken', () => {
		it('should throw error when username is missing', async () => {
			const incompleteCredentials: Partial<SprykerCredentials> = {
				password: 'password123',
				baseUrl: 'https://glue.eu.spryker.local',
			};

			(mockContext.getCredentials as jest.Mock).mockResolvedValue(incompleteCredentials);

			await expect(authService.getValidAccessToken()).rejects.toThrow('Username and password are required');
		});

		it('should throw error when password is missing', async () => {
			const incompleteCredentials: Partial<SprykerCredentials> = {
				username: 'test@example.com',
				baseUrl: 'https://glue.eu.spryker.local',
			};

			(mockContext.getCredentials as jest.Mock).mockResolvedValue(incompleteCredentials);

			await expect(authService.getValidAccessToken()).rejects.toThrow('Username and password are required');
		});

		it('should get new token when using credentials method', async () => {
			const mockTokenResponse: SprykerTokenResponse = {
				data: {
					type: 'access-tokens',
					id: null,
					attributes: {
						tokenType: 'Bearer',
						expiresIn: 28800,
						accessToken: 'new-access-token-123',
						refreshToken: 'refresh-token-123',
					},
					links: {
						self: 'http://glue.eu.spryker.local/access-tokens',
					},
				},
			};

			(mockContext.helpers.request as jest.Mock).mockResolvedValue(mockTokenResponse);

			const token = await authService.getValidAccessToken();
			expect(token).toBe('new-access-token-123');

			// Verify the request was made correctly
			expect(mockContext.helpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://glue.eu.spryker.local/access-tokens',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: {
					data: {
						type: 'access-tokens',
						attributes: {
							username: 'test@example.com',
							password: 'password123',
						},
					},
				},
				json: true,
				tls: {
					rejectUnauthorized: false,
				},
			});
		});

		it('should return cached token when still valid', async () => {
			const mockTokenResponse: SprykerTokenResponse = {
				data: {
					type: 'access-tokens',
					id: null,
					attributes: {
						tokenType: 'Bearer',
						expiresIn: 28800,
						accessToken: 'cached-token-123',
						refreshToken: 'refresh-token-123',
					},
					links: {
						self: 'http://glue.eu.spryker.local/access-tokens',
					},
				},
			};

			(mockContext.helpers.request as jest.Mock).mockResolvedValue(mockTokenResponse);

			// First call should get new token
			const token1 = await authService.getValidAccessToken();
			expect(token1).toBe('cached-token-123');

			// Second call should use cached token
			const token2 = await authService.getValidAccessToken();
			expect(token2).toBe('cached-token-123');

			// Request should only be called once
			expect(mockContext.helpers.request).toHaveBeenCalledTimes(1);
		});

		it('should refresh token when cached token is expired', async () => {
			// Mock an expired token in cache
			const expiredTime = Date.now() - 1000; // 1 second ago
			const cacheKey = `${mockCredentials.baseUrl}:${mockCredentials.username}`;
			
			// Manually set expired token in cache
			(SprykerAuthService as any).tokenCache.set(cacheKey, {
				accessToken: 'expired-token',
				refreshToken: 'refresh-token-123',
				expiresAt: expiredTime,
			});

			const mockRefreshResponse: SprykerTokenResponse = {
				data: {
					type: 'refresh-tokens',
					id: null,
					attributes: {
						tokenType: 'Bearer',
						expiresIn: 28800,
						accessToken: 'refreshed-token-123',
						refreshToken: 'new-refresh-token-123',
					},
					links: {
						self: 'http://glue.eu.spryker.local/refresh-tokens',
					},
				},
			};

			(mockContext.helpers.request as jest.Mock).mockResolvedValue(mockRefreshResponse);

			const token = await authService.getValidAccessToken();
			expect(token).toBe('refreshed-token-123');

			// Verify refresh token request was made
			expect(mockContext.helpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://glue.eu.spryker.local/refresh-tokens',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: {
					data: {
						type: 'refresh-tokens',
						attributes: {
							refreshToken: 'refresh-token-123',
						},
					},
				},
				json: true,
				tls: {
					rejectUnauthorized: false,
				},
			});
		});

		it('should get new token when refresh fails', async () => {
			// Mock an expired token in cache
			const expiredTime = Date.now() - 1000;
			const cacheKey = `${mockCredentials.baseUrl}:${mockCredentials.username}`;
			
			(SprykerAuthService as any).tokenCache.set(cacheKey, {
				accessToken: 'expired-token',
				refreshToken: 'invalid-refresh-token',
				expiresAt: expiredTime,
			});

			const mockNewTokenResponse: SprykerTokenResponse = {
				data: {
					type: 'access-tokens',
					id: null,
					attributes: {
						tokenType: 'Bearer',
						expiresIn: 28800,
						accessToken: 'new-token-after-refresh-fail',
						refreshToken: 'new-refresh-token',
					},
					links: {
						self: 'http://glue.eu.spryker.local/access-tokens',
					},
				},
			};

			// First call (refresh) fails, second call (new token) succeeds
			(mockContext.helpers.request as jest.Mock)
				.mockRejectedValueOnce(new Error('Invalid refresh token'))
				.mockResolvedValueOnce(mockNewTokenResponse);

			const token = await authService.getValidAccessToken();
			expect(token).toBe('new-token-after-refresh-fail');

			// Should have made 2 requests: refresh (failed) and new token (success)
			expect(mockContext.helpers.request).toHaveBeenCalledTimes(2);
		});

		it('should throw error when credentials are missing', async () => {
			(mockContext.getCredentials as jest.Mock).mockResolvedValue(null);

			await expect(authService.getValidAccessToken()).rejects.toThrow('No credentials provided');
		});

		it('should throw error when username/password are missing', async () => {
			const incompleteCredentials: Partial<SprykerCredentials> = {
				baseUrl: 'https://glue.eu.spryker.local',
			};

			(mockContext.getCredentials as jest.Mock).mockResolvedValue(incompleteCredentials);

			await expect(authService.getValidAccessToken()).rejects.toThrow('Username and password are required');
		});
	});

	describe('static methods', () => {
		it('should clear token cache', () => {
			// Add a token to cache
			const cacheKey = 'test:user';
			(SprykerAuthService as any).tokenCache.set(cacheKey, {
				accessToken: 'test-token',
				refreshToken: 'test-refresh',
				expiresAt: Date.now() + 10000,
			});

			expect((SprykerAuthService as any).tokenCache.size).toBe(1);

			SprykerAuthService.clearTokenCache();

			expect((SprykerAuthService as any).tokenCache.size).toBe(0);
		});

		it('should get cached token info', () => {
			const tokenInfo = {
				accessToken: 'test-token',
				refreshToken: 'test-refresh',
				expiresAt: Date.now() + 10000,
			};

			(SprykerAuthService as any).tokenCache.set('https://test.com:user', tokenInfo);

			const retrieved = SprykerAuthService.getCachedTokenInfo('https://test.com', 'user');
			expect(retrieved).toEqual(tokenInfo);

			const notFound = SprykerAuthService.getCachedTokenInfo('https://other.com', 'user');
			expect(notFound).toBeUndefined();
		});
	});
});
