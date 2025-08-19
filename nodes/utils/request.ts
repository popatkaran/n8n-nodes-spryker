import { IRequestOptions, IHttpRequestMethods, NodeOperationError } from 'n8n-workflow';
import { SprykerExecutionContext, QueryParams } from '../types';
import { SprykerAuthService } from '../services/authService';

export class SprykerRequestBuilder {
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

	build(): string {
		let url = `${this.baseUrl}/${this.endpoint}`;

		const queryString = Object.entries(this.queryParams)
			.map(([key, value]) => `${key}=${value}`)
			.join('&');

		if (queryString) {
			url += `?${queryString}`;
		}

		return url;
	}
}

export async function createSprykerRequest(
	context: SprykerExecutionContext,
	url: string,
	itemIndex: number,
	method: IHttpRequestMethods = 'GET',
	body?: any
): Promise<IRequestOptions> {
	const options: IRequestOptions = {
		method,
		uri: url,
		headers: {
			'Accept': 'application/json',
			'Accept-Language': 'en',
		},
		json: true,
		timeout: 30000, // 30 second timeout
		// @ts-ignore
		tls: {
			rejectUnauthorized: false,
		},
	};

	// Add Content-Type header for POST requests
	if (method === 'POST' && body) {
		options.headers!['Content-Type'] = 'application/json';
		options.body = body;
	}

	// Always add authentication - the AuthService will handle token management
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

export async function executeSprykerRequest(
	context: SprykerExecutionContext,
	options: IRequestOptions,
	itemIndex: number
): Promise<any> {
	try {
		const response = await context.helpers.request(options);
		return response;
	} catch (error) {
		// Check if it's an authentication error (401)
		if (error.statusCode === 401) {
			// Clear token cache and retry once
			SprykerAuthService.clearTokenCache();
			
			try {
				// Recreate the request with fresh authentication
				const authService = new SprykerAuthService(context, itemIndex);
				const accessToken = await authService.getValidAccessToken();
				options.headers!['Authorization'] = `Bearer ${accessToken}`;
				
				// Retry the request
				const retryResponse = await context.helpers.request(options);
				return retryResponse;
			} catch (retryError) {
				throw new NodeOperationError(
					context.getNode(),
					`Spryker API authentication failed after retry: ${retryError.message}`,
					{ itemIndex }
				);
			}
		}

		// Provide more specific error messages
		if (error.statusCode === 403) {
			throw new NodeOperationError(
				context.getNode(),
				'Access forbidden. Check if your user has the required permissions for this operation.',
				{ itemIndex }
			);
		} else if (error.statusCode === 404) {
			throw new NodeOperationError(
				context.getNode(),
				'Resource not found. Please check the endpoint URL and resource ID.',
				{ itemIndex }
			);
		} else if (error.statusCode === 422) {
			throw new NodeOperationError(
				context.getNode(),
				`Validation error: ${error.message}. Please check your request data.`,
				{ itemIndex }
			);
		} else if (error.code === 'ECONNREFUSED') {
			throw new NodeOperationError(
				context.getNode(),
				'Cannot connect to Spryker API. Please check your baseUrl and network connection.',
				{ itemIndex }
			);
		} else if (error.code === 'ETIMEDOUT') {
			throw new NodeOperationError(
				context.getNode(),
				'Request timeout. Spryker API is not responding.',
				{ itemIndex }
			);
		}

		throw new NodeOperationError(
			context.getNode(),
			`Spryker API request failed: ${error.message}`,
			{ itemIndex }
		);
	}
}
