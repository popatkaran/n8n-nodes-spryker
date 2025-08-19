import { IRequestOptions, IHttpRequestMethods, NodeOperationError } from 'n8n-workflow';
import { SprykerExecutionContext, QueryParams } from '../types';
import { SprykerAuthService } from '../services/authService';
import { SprykerLogger } from '../services/sprykerLogger';

export interface LoggingOptions {
	logLevel?: 'basic' | 'detailed' | 'debug';
	includeRequestBody?: boolean;
	includeResponseBody?: boolean;
	maxLogFileSize?: number;
	logRetentionDays?: number;
}

export class SprykerRequestBuilderWithLogging {
	private readonly baseUrl: string;
	private endpoint: string | undefined;
	private queryParams: QueryParams = {};

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
	}

	setEndpoint(endpoint: string): this {
		this.endpoint = endpoint;
		return this;
	}

	addQueryParam(key: string, value: any): this {
		if (value !== undefined && value !== null && value !== '') {
			this.queryParams[key] = value;
		}
		return this;
	}

	addInclude(include: string | undefined): this {
		if (include) {
			this.addQueryParam('include', encodeURIComponent(include));
		}
		return this;
	}

	addPagination(pageSize?: number, pageNumber?: number): this {
		if (pageSize) {
			this.addQueryParam('page[limit]', encodeURIComponent(pageSize.toString()));
		}

		if (pageNumber && pageNumber > 1) {
			const offset = (pageNumber - 1) * (pageSize || 20);
			this.addQueryParam('page[offset]', encodeURIComponent(offset.toString()));
		}

		return this;
	}

	addFilter(filterKey: string, filterValue: string): this {
		if (filterKey && filterValue) {
			this.addQueryParam(`filter[${filterKey}]`, encodeURIComponent(filterValue));
		}
		return this;
	}

	addSort(sortField: string, direction: 'asc' | 'desc' = 'asc'): this {
		if (sortField) {
			const sortValue = direction === 'desc' ? `-${sortField}` : sortField;
			this.addQueryParam('sort', encodeURIComponent(sortValue));
		}
		return this;
	}

	build(): string {
		if (!this.endpoint) {
			throw new Error('Endpoint is required to build URL');
		}

		let url = `${this.baseUrl}/${this.endpoint}`;

		const queryString = Object.entries(this.queryParams)
			.map(([key, value]) => `${key}=${value}`)
			.join('&');

		if (queryString) {
			url += `?${queryString}`;
		}

		return url;
	}

	getQueryParams(): QueryParams {
		return { ...this.queryParams };
	}
}

export async function createSprykerRequestWithLogging(
	context: SprykerExecutionContext,
	url: string,
	itemIndex: number,
	method: IHttpRequestMethods = 'GET',
	body?: any,
	additionalHeaders?: Record<string, string>
): Promise<IRequestOptions> {
	const options: IRequestOptions = {
		method,
		uri: url,
		headers: {
			'Accept': 'application/json',
			'Accept-Language': 'en',
			'User-Agent': 'n8n-spryker-node/1.0.0',
			...additionalHeaders,
		},
		json: true,
		timeout: 30000, // 30 second timeout
		// @ts-ignore
		tls: {
			rejectUnauthorized: false,
		},
	};

	// Add Content-Type header for POST/PUT/PATCH requests
	if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
		options.headers!['Content-Type'] = 'application/json';
		options.body = body;
	}

	// Add authentication
	try {
		const authService = new SprykerAuthService(context, itemIndex);
		const accessToken = await authService.getValidAccessToken();
		options.headers!['Authorization'] = `Bearer ${accessToken}`;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Authentication failed: ${error.message}`,
			{ itemIndex }
		);
	}

	return options;
}

export async function executeSprykerRequestWithLogging(
	context: SprykerExecutionContext,
	options: IRequestOptions,
	itemIndex: number,
	operation: string,
	resource: string,
	maxRetries: number = 2
): Promise<any> {
	const logger = SprykerLogger.getInstance();
	
	// Check if logging is enabled
	const enableLogging = context.getNodeParameter('enableLogging', itemIndex) as boolean;
	const loggingOptions = context.getNodeParameter('loggingOptions', itemIndex) as LoggingOptions;
	
	// Configure logger
	logger.setEnabled(enableLogging);
	
	let requestId = '';
	let startTime = Date.now();
	let lastError: any;

	// Log request if logging is enabled
	if (enableLogging) {
		// Get workflow context for better logging
		const node = context.getNode();
		const workflowContext = {
			nodeExecutionId: node.id,
			workflowId: process.env.N8N_WORKFLOW_ID || 'unknown',
		};

		// Create a copy of options for logging (sanitize sensitive data)
		const sanitizedOptions = createLoggingOptions(options, loggingOptions);
		
		requestId = logger.logRequest(
			sanitizedOptions,
			operation,
			resource,
			workflowContext
		);
	}

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		try {
			const response = await context.helpers.request(options);
			const responseTime = Date.now() - startTime;
			
			// Log successful response
			if (enableLogging && requestId) {
				logger.logResponse(
					requestId,
					shouldIncludeResponseBody(response, loggingOptions) ? response : '[BODY_EXCLUDED]',
					responseTime,
					200, // Assume 200 for successful requests
					{}
				);
			}
			
			// Log successful request for debugging
			if (process.env.NODE_ENV === 'development') {
				console.log(`Spryker API request successful: ${options.method} ${options.uri} (${responseTime}ms)`);
			}
			
			return response;
		} catch (error) {
			lastError = error;
			const responseTime = Date.now() - startTime;
			
			// Log error
			if (enableLogging && requestId) {
				logger.logError(requestId, error, responseTime);
			}
			
			// Handle different types of errors
			if (error.statusCode === 401 && attempt <= maxRetries) {
				// Authentication error - clear cache and retry with fresh token
				console.warn(`Authentication error on attempt ${attempt}, retrying with fresh token...`);
				SprykerAuthService.clearTokenCache();
				
				try {
					// Get fresh token and update request headers
					const authService = new SprykerAuthService(context, itemIndex);
					const accessToken = await authService.getValidAccessToken();
					options.headers!['Authorization'] = `Bearer ${accessToken}`;
					
					// Reset start time for retry
					startTime = Date.now();
					
					// Continue to next iteration to retry the request
					continue;
				} catch (authError) {
					throw new NodeOperationError(
						context.getNode(),
						`Authentication failed after retry: ${authError.message}`,
						{ itemIndex }
					);
				}
			} else if (error.statusCode === 429 && attempt <= maxRetries) {
				// Rate limiting - wait and retry
				const retryAfter = error.response?.headers['retry-after'] || Math.pow(2, attempt);
				console.warn(`Rate limited, waiting ${retryAfter} seconds before retry...`);
				await delay(retryAfter * 1000);
				startTime = Date.now(); // Reset start time
				continue;
			} else if (error.code === 'ETIMEDOUT' && attempt <= maxRetries) {
				// Timeout - retry with exponential backoff
				console.warn(`Request timeout on attempt ${attempt}, retrying...`);
				await delay(Math.pow(2, attempt - 1) * 1000);
				startTime = Date.now(); // Reset start time
				continue;
			} else if (error.code === 'ECONNRESET' && attempt <= maxRetries) {
				// Connection reset - retry
				console.warn(`Connection reset on attempt ${attempt}, retrying...`);
				await delay(1000 * attempt);
				startTime = Date.now(); // Reset start time
				continue;
			}
			
			// If we reach here, either it's not a retryable error or we've exhausted retries
			break;
		}
	}

	// Format error message based on error type
	const errorMessage = formatSprykerError(lastError);
	throw new NodeOperationError(
		context.getNode(),
		errorMessage,
		{ itemIndex }
	);
}

/**
 * Create logging-safe options (remove sensitive data based on logging level)
 */
function createLoggingOptions(options: IRequestOptions, loggingOpts?: LoggingOptions): IRequestOptions {
	const logLevel = loggingOpts?.logLevel || 'detailed';
	const includeRequestBody = loggingOpts?.includeRequestBody !== false;
	
	const loggingOptions: IRequestOptions = {
		...options,
		headers: { ...options.headers },
	};

	// Always sanitize authorization headers
	if (loggingOptions.headers?.Authorization) {
		loggingOptions.headers.Authorization = '[REDACTED]';
	}
	if (loggingOptions.headers?.authorization) {
		loggingOptions.headers.authorization = '[REDACTED]';
	}

	// Handle request body based on settings
	if (!includeRequestBody && loggingOptions.body) {
		loggingOptions.body = '[BODY_EXCLUDED]';
	}

	// For basic logging, remove most headers
	if (logLevel === 'basic') {
		loggingOptions.headers = {
			'Content-Type': loggingOptions.headers?.['Content-Type'] || '',
			'Accept': loggingOptions.headers?.Accept || '',
		};
	}

	return loggingOptions;
}

/**
 * Determine if response body should be included in logs
 */
function shouldIncludeResponseBody(response: any, loggingOpts?: LoggingOptions): boolean {
	const includeResponseBody = loggingOpts?.includeResponseBody !== false;
	const logLevel = loggingOpts?.logLevel || 'detailed';
	
	if (!includeResponseBody) {
		return false;
	}
	
	if (logLevel === 'basic') {
		return false;
	}
	
	// Check response size (don't log very large responses)
	try {
		const responseSize = JSON.stringify(response).length;
		if (responseSize > 1024 * 1024) { // 1MB limit
			return false;
		}
	} catch {
		// If we can't stringify, don't include
		return false;
	}
	
	return true;
}

/**
 * Format Spryker API errors into user-friendly messages
 */
function formatSprykerError(error: any): string {
	if (error.statusCode) {
		switch (error.statusCode) {
			case 400:
				return `Bad request: ${error.message || 'Invalid request parameters'}`;
			case 401:
				return 'Authentication failed: Invalid credentials or expired token';
			case 403:
				return 'Access forbidden: Insufficient permissions for this resource';
			case 404:
				return 'Resource not found: The requested resource does not exist';
			case 422:
				return `Validation error: ${error.message || 'Request data is invalid'}`;
			case 429:
				return 'Rate limit exceeded: Too many requests, please try again later';
			case 500:
				return 'Spryker API server error: Please try again later';
			case 502:
			case 503:
			case 504:
				return 'Spryker API is temporarily unavailable: Please try again later';
			default:
				return `Spryker API error (${error.statusCode}): ${error.message}`;
		}
	}

	if (error.code) {
		switch (error.code) {
			case 'ECONNREFUSED':
				return 'Cannot connect to Spryker API: Please check your baseUrl and network connection';
			case 'ETIMEDOUT':
				return 'Request timeout: Spryker API is not responding';
			case 'ENOTFOUND':
				return 'DNS resolution failed: Please check your baseUrl';
			case 'ECONNRESET':
				return 'Connection was reset: Please try again';
			default:
				return `Network error (${error.code}): ${error.message}`;
		}
	}

	return `Spryker API request failed: ${error.message || 'Unknown error'}`;
}

/**
 * Delay function for retry logic
 */
function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to validate Spryker API response structure
 */
export function validateSprykerResponse(response: any): boolean {
	return response && (
		(response.data !== undefined) || 
		(response.errors !== undefined)
	);
}

/**
 * Helper function to extract errors from Spryker API response
 */
export function extractSprykerErrors(response: any): string[] {
	if (!response.errors || !Array.isArray(response.errors)) {
		return [];
	}

	return response.errors.map((error: any) => {
		if (typeof error === 'string') {
			return error;
		}
		
		if (error.detail) {
			return error.detail;
		}
		
		if (error.title) {
			return error.title;
		}
		
		return JSON.stringify(error);
	});
}

/**
 * Create a request builder instance
 */
export function createRequestBuilderWithLogging(baseUrl: string): SprykerRequestBuilderWithLogging {
	return new SprykerRequestBuilderWithLogging(baseUrl);
}

/**
 * Get logging statistics
 */
export function getLoggingStats(): any {
	const logger = SprykerLogger.getInstance();
	return logger.getLogStats();
}

/**
 * Clean up old log files
 */
export function cleanupOldLogs(daysToKeep: number = 30): number {
	const logger = SprykerLogger.getInstance();
	return logger.cleanupOldLogs(daysToKeep);
}
