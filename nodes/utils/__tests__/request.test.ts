
import { SprykerRequestBuilder, createSprykerRequest, executeSprykerRequest } from '../request';
import { SprykerExecutionContext, SprykerCredentials } from '../../types';
import { mock } from 'jest-mock-extended';
import { NodeOperationError } from 'n8n-workflow';

describe('SprykerRequestBuilder', () => {
	it('should build a simple URL', () => {
		const builder = new SprykerRequestBuilder('http://localhost');
		const url = builder.setEndpoint('test').build();
		expect(url).toBe('http://localhost/test');
	});

	it('should build a URL with query parameters', () => {
		const builder = new SprykerRequestBuilder('http://localhost');
		const url = builder.setEndpoint('test').addQueryParam('a', 1).addQueryParam('b', 'test').build();
		expect(url).toBe('http://localhost/test?a=1&b=test');
	});

	it('should not add empty query parameters', () => {
		const builder = new SprykerRequestBuilder('http://localhost');
		const url = builder.setEndpoint('test').addQueryParam('a', null).addQueryParam('b', undefined).addQueryParam('c', '').build();
		expect(url).toBe('http://localhost/test');
	});

	it('should add include parameter', () => {
		const builder = new SprykerRequestBuilder('http://localhost');
		const url = builder.setEndpoint('test').addInclude('a,b,c').build();
		expect(url).toBe('http://localhost/test?include=a%2Cb%2Cc');
	});

	it('should handle pagination', () => {
		const builder = new SprykerRequestBuilder('http://localhost');
		const url = builder.setEndpoint('test').addPagination(10, 2).build();
		expect(url).toBe('http://localhost/test?page[limit]=10&page[offset]=10');
	});
});

describe('createSprykerRequest', () => {
	let context: SprykerExecutionContext;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
	});

	it('should create a request with no authentication', async () => {
		const options = await createSprykerRequest(context, 'http://localhost', 'noAuth', 0);
		expect(options.headers?.Authorization).toBeUndefined();
	});

	it('should create a request with access token authentication', async () => {
		const credentials = { accessToken: 'test-token' } as SprykerCredentials;
		(context.getCredentials as jest.Mock).mockResolvedValue(credentials);
		const options = await createSprykerRequest(context, 'http://localhost', 'accessToken', 0);
		expect(options.headers?.Authorization).toBe('Bearer test-token');
	});
});

describe('executeSprykerRequest', () => {
	let context: SprykerExecutionContext;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
		context.helpers = { request: jest.fn() };
	});

	it('should return the response on success', async () => {
		const response = { data: 'test' };
		(context.helpers.request as jest.Mock).mockResolvedValue(response);
		await expect(executeSprykerRequest(context, {}, 0)).resolves.toBe(response);
	});

	it('should throw a NodeOperationError on failure', async () => {
		const error = new Error('Request failed');
		(context.helpers.request as jest.Mock).mockRejectedValue(error);
		await expect(executeSprykerRequest(context, {}, 0)).rejects.toThrow(NodeOperationError);
	});
});
