import { AbstractProductService } from '../services/abstractProductService';
import { SprykerExecutionContext } from '../types';
import { mock } from 'jest-mock-extended';

// Mock the request utilities
jest.mock('../utils/request', () => ({
	SprykerRequestBuilder: jest.fn().mockImplementation(() => ({
		setEndpoint: jest.fn().mockReturnThis(),
		addInclude: jest.fn().mockReturnThis(),
		addPagination: jest.fn().mockReturnThis(),
		build: jest.fn().mockReturnValue('http://test.com/api'),
	})),
	createSprykerRequest: jest.fn().mockResolvedValue({}),
	executeSprykerRequest: jest.fn(),
}));

describe('AbstractProductService', () => {
	let service: AbstractProductService;
	let mockContext: SprykerExecutionContext;
	const itemIndex = 0;

	beforeEach(() => {
		mockContext = mock<SprykerExecutionContext>();
		service = new AbstractProductService(mockContext, itemIndex);

		// Default mock implementations
		(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			switch (name) {
				case 'baseUrl':
					return 'https://glue.eu.spryker.local';
				case 'authentication':
					return 'none';
				case 'additionalFields':
					return {};
				case 'abstractProductId':
					return '001';
				case 'productReviewId':
					return '26';
				case 'rating':
					return 5;
				case 'nickname':
					return 'Test User';
				case 'summary':
					return 'Test Summary';
				case 'description':
					return 'Test Description';
				default:
					return undefined;
			}
		});
	});

	describe('getById', () => {
		it('should get abstract product by ID', async () => {
			const mockResponse = {
				data: {
					id: '001',
					type: 'abstract-products',
					attributes: {
						sku: '001',
						name: 'Test Product',
						description: 'Test Description',
					},
				},
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getById();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '001',
				type: 'abstract-products',
				sku: '001',
				name: 'Test Product',
				description: 'Test Description',
			});
		});
	});

	describe('getPrices', () => {
		it('should get abstract product prices', async () => {
			const mockResponse = {
				data: [{
					id: '001',
					type: 'abstract-product-prices',
					attributes: {
						price: 3750,
						prices: [{
							priceTypeName: 'DEFAULT',
							netAmount: null,
							grossAmount: 3750,
							currency: {
								code: 'EUR',
								name: 'Euro',
								symbol: '€',
							},
							volumePrices: [],
						}],
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getPrices();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '001',
				type: 'abstract-product-prices',
				price: 3750,
			});
		});
	});

	describe('getAvailabilities', () => {
		it('should get abstract product availabilities', async () => {
			const mockResponse = {
				data: [{
					id: '001',
					type: 'abstract-product-availabilities',
					attributes: {
						availability: true,
						quantity: '10.0000000000',
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getAvailabilities();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '001',
				type: 'abstract-product-availabilities',
				availability: true,
				quantity: '10.0000000000',
			});
		});
	});

	describe('getRelatedProducts', () => {
		it('should get related products', async () => {
			const mockResponse = {
				data: [{
					id: '002',
					type: 'abstract-products',
					attributes: {
						sku: '002',
						name: 'Related Product',
						description: 'Related Description',
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getRelatedProducts();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '002',
				sku: '002',
				name: 'Related Product',
			});
		});
	});

	describe('getImages', () => {
		it('should get abstract product images', async () => {
			const mockResponse = {
				data: [{
					id: '001',
					type: 'abstract-product-image-sets',
					attributes: {
						imageSets: [{
							name: 'default',
							images: [{
								externalUrlLarge: 'https://example.com/large.jpg',
								externalUrlSmall: 'https://example.com/small.jpg',
							}],
						}],
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getImages();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '001',
				type: 'abstract-product-image-sets',
			});
			expect(result[0].json.imageSets).toHaveLength(1);
		});
	});

	describe('getTaxSets', () => {
		it('should get abstract product tax sets', async () => {
			const mockResponse = {
				data: [{
					id: '0e93b0d4-6d83-5fc1-ac1d-d6ae11690406',
					type: 'product-tax-sets',
					attributes: {
						name: 'Entertainment Electronics',
						restTaxRates: [{
							name: 'Germany Standard',
							rate: '19.00',
							country: 'DE',
						}],
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getTaxSets();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '0e93b0d4-6d83-5fc1-ac1d-d6ae11690406',
				type: 'product-tax-sets',
				name: 'Entertainment Electronics',
			});
		});
	});

	describe('getReviews', () => {
		it('should get abstract product reviews', async () => {
			const mockResponse = {
				data: [{
					id: '26',
					type: 'product-reviews',
					attributes: {
						rating: 4,
						nickname: 'Sonia Wagner',
						summary: "It's Sonia's review",
						description: 'This is a manual description I need to write for testing in 2025.',
					},
				}],
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getReviews();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '26',
				type: 'product-reviews',
				rating: 4,
				nickname: 'Sonia Wagner',
			});
		});
	});

	describe('getReview', () => {
		it('should get a specific product review', async () => {
			const mockResponse = {
				data: {
					id: '26',
					type: 'product-reviews',
					attributes: {
						rating: 4,
						nickname: 'Sonia Wagner',
						summary: "It's Sonia's review",
						description: 'This is a manual description I need to write for testing in 2025.',
					},
				},
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getReview();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '26',
				type: 'product-reviews',
				rating: 4,
				nickname: 'Sonia Wagner',
			});
		});
	});

	describe('createReview', () => {
		it('should create a new product review', async () => {
			const mockResponse = {
				data: {
					id: '27',
					type: 'product-reviews',
					attributes: {
						rating: 5,
						nickname: 'Test User',
						summary: 'Test Summary',
						description: 'Test Description',
					},
				},
			};

			const { executeSprykerRequest, createSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.createReview();

			expect(result).toHaveLength(1);
			expect(result[0].json).toMatchObject({
				id: '27',
				type: 'product-reviews',
				rating: 5,
				nickname: 'Test User',
			});

			// Verify that POST request was made with correct body
			expect(createSprykerRequest).toHaveBeenCalledWith(
				mockContext,
				'http://test.com/api',
				'none',
				0,
				'POST',
				{
					data: {
						type: 'product-reviews',
						attributes: {
							rating: 5,
							nickname: 'Test User',
							summary: 'Test Summary',
							description: 'Test Description',
						},
					},
				}
			);
		});
	});

	describe('field extraction', () => {
		it('should extract specific fields when fieldsToExtract is provided', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'additionalFields') {
					return { fieldsToExtract: 'id,rating,nickname' };
				}
				if (name === 'baseUrl') return 'https://glue.eu.spryker.local';
				if (name === 'authentication') return 'none';
				if (name === 'abstractProductId') return '001';
				if (name === 'productReviewId') return '26';
				return undefined;
			});

			const mockResponse = {
				data: {
					id: '26',
					type: 'product-reviews',
					attributes: {
						rating: 4,
						nickname: 'Sonia Wagner',
						summary: "It's Sonia's review",
						description: 'This is a manual description.',
					},
				},
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getReview();

			expect(result[0].json).toEqual({
				id: '26',
				rating: 4,
				nickname: 'Sonia Wagner',
			});
		});
	});

	describe('raw response', () => {
		it('should return raw response when rawResponse is true', async () => {
			(mockContext.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'additionalFields') {
					return { rawResponse: true };
				}
				if (name === 'baseUrl') return 'https://glue.eu.spryker.local';
				if (name === 'authentication') return 'none';
				if (name === 'abstractProductId') return '001';
				return undefined;
			});

			const mockResponse = {
				data: { id: '001' },
				links: { self: 'http://test.com' },
			};

			const { executeSprykerRequest } = require('../utils/request');
			executeSprykerRequest.mockResolvedValue(mockResponse);

			const result = await service.getById();

			expect(result[0].json).toEqual(mockResponse);
		});
	});
});
