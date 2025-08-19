
import { SprykerRequestBuilder, createSprykerRequest, executeSprykerRequest } from '../request';
import { SprykerExecutionContext } from '../../types';
import { SprykerAuthService } from '../../services/authService';
import { mock } from 'jest-mock-extended';
import { NodeOperationError } from 'n8n-workflow';

// Mock the SprykerAuthService
jest.mock('../../services/authService');

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
	let mockAuthService: jest.Mocked<SprykerAuthService>;
	const MockedSprykerAuthService = SprykerAuthService as jest.MockedClass<typeof SprykerAuthService>;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
		mockAuthService = {
			getValidAccessToken: jest.fn(),
		} as any;
		MockedSprykerAuthService.mockImplementation(() => mockAuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create a request with authentication', async () => {
		mockAuthService.getValidAccessToken.mockResolvedValue('test-token');
		
		const options = await createSprykerRequest(context, 'http://localhost', 0);
		expect(options.headers?.Authorization).toBe('Bearer test-token');
		expect(mockAuthService.getValidAccessToken).toHaveBeenCalled();
	});

	it('should throw error when authentication fails', async () => {
		mockAuthService.getValidAccessToken.mockRejectedValue(new Error('Auth failed'));
		
		await expect(createSprykerRequest(context, 'http://localhost', 0))
			.rejects.toThrow('Authentication failed: Auth failed');
	});
});

describe('executeSprykerRequest', () => {
	let context: SprykerExecutionContext;
	let mockAuthService: jest.Mocked<SprykerAuthService>;
	const MockedSprykerAuthService = SprykerAuthService as jest.MockedClass<typeof SprykerAuthService>;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
		context.helpers = { request: jest.fn() };
		mockAuthService = {
			getValidAccessToken: jest.fn(),
		} as any;
		MockedSprykerAuthService.mockImplementation(() => mockAuthService);
		
		// Mock static methods
		MockedSprykerAuthService.clearTokenCache = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
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

	it('should retry on 401 error with fresh token', async () => {
		const authError = new Error('Unauthorized');
		(authError as any).statusCode = 401;
		
		const successResponse = { data: 'success' };
		mockAuthService.getValidAccessToken.mockResolvedValue('fresh-token');
		
		(context.helpers.request as jest.Mock)
			.mockRejectedValueOnce(authError)
			.mockResolvedValueOnce(successResponse);

		const options = {
			headers: { Authorization: 'Bearer old-token' }
		};

		const result = await executeSprykerRequest(context, options, 0);
		
		expect(result).toBe(successResponse);
		expect(MockedSprykerAuthService.clearTokenCache).toHaveBeenCalled();
		expect(mockAuthService.getValidAccessToken).toHaveBeenCalled();
		expect(options.headers.Authorization).toBe('Bearer fresh-token');
		expect(context.helpers.request).toHaveBeenCalledTimes(2);
	});

	it('should throw error when retry also fails', async () => {
		const authError = new Error('Unauthorized');
		(authError as any).statusCode = 401;
		
		const retryError = new Error('Retry failed');
		mockAuthService.getValidAccessToken.mockRejectedValue(retryError);
		
		(context.helpers.request as jest.Mock).mockRejectedValue(authError);

		const options = {
			headers: { Authorization: 'Bearer old-token' }
		};

		await expect(executeSprykerRequest(context, options, 0))
			.rejects.toThrow('Spryker API authentication failed after retry: Retry failed');
	});
});
