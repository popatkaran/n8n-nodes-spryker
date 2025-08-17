import { IRequestOptions, IHttpRequestMethods, NodeOperationError } from 'n8n-workflow';
import { SprykerCredentials, SprykerExecutionContext, QueryParams } from '../types';

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
	authentication: string,
	itemIndex: number
): Promise<IRequestOptions> {
	const options: IRequestOptions = {
		method: 'GET' as IHttpRequestMethods,
		uri: url,
		headers: {
			'Accept': 'application/json',
			'Accept-Language': 'en',
		},
		json: true,
		// @ts-ignore
		tls: {
			rejectUnauthorized: false,
		},
	};

	// Add authentication if required
	if (authentication === 'accessToken') {
		const credentials = await context.getCredentials('sprykerApi') as SprykerCredentials;
		if (credentials && credentials.accessToken) {
			options.headers!['Authorization'] = `Bearer ${credentials.accessToken}`;
		}
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
		throw new NodeOperationError(
			context.getNode(),
			`Spryker API request failed: ${error.message}`,
			{ itemIndex }
		);
	}
}
