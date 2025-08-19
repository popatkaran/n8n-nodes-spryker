import { CmsPageService } from '../services/cmsPageService';
import { SprykerExecutionContext } from '../types';
import { mock } from 'jest-mock-extended';

// Mock the SprykerAuthService
jest.mock('../services/authService', () => ({
	SprykerAuthService: jest.fn().mockImplementation(() => ({
		getValidAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
	})),
}));

describe('CmsPageService', () => {
	let context: SprykerExecutionContext;
	let cmsPageService: CmsPageService;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
		context.helpers = { request: jest.fn() };
		(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			if (name === 'baseUrl') {
				return 'http://localhost';
			}
			return { additionalFields: {} };
		});
		(context.getCredentials as jest.Mock).mockResolvedValue({
			username: 'test@example.com',
			password: 'password123',
			baseUrl: 'http://localhost',
		});
		cmsPageService = new CmsPageService(context, 0);
	});

	describe('getMany', () => {
		it('should return a transformed list of CMS pages', async () => {
			// Given
			const response = {
				data: [
					{
						type: 'cms-pages',
						id: '1',
						attributes: { name: 'Page 1', url: '/page-1' },
						links: { self: 'http://localhost/cms-pages/1' },
					},
					{
						type: 'cms-pages',
						id: '2',
						attributes: { name: 'Page 2', url: '/page-2' },
						links: { self: 'http://localhost/cms-pages/2' },
					},
				],
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(response);

			// When
			const result = await cmsPageService.getMany();

			// Then
			expect(result).toEqual([
				{
					json: {
						id: '1',
						type: 'cms-pages',
						name: 'Page 1',
						url: '/page-1',
						links: { self: 'http://localhost/cms-pages/1' },
						_raw: response.data[0],
					},
				},
				{
					json: {
						id: '2',
						type: 'cms-pages',
						name: 'Page 2',
						url: '/page-2',
						links: { self: 'http://localhost/cms-pages/2' },
						_raw: response.data[1],
					},
				},
			]);
		});

		it('should return a transformed list of CMS pages with selected fields', async () => {
			// Given
			const response = {
				data: [
					{
						type: 'cms-pages',
						id: '1',
						attributes: { name: 'Page 1', url: '/page-1', description: 'Desc 1' },
						links: { self: 'http://localhost/cms-pages/1' },
					},
					{
						attributes: { name: 'Page 2', url: '/page-2', description: 'Desc 2' },
						links: { self: 'http://localhost/cms-pages/2' },
					},
				],
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(response);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'additionalFields') {
					return { fieldsToExtract: 'name,url' };
				}
				return {};
			});

			// When
			const result = await cmsPageService.getMany();

			// Then
			expect(result).toEqual([
				{
					json: {
						name: 'Page 1',
						url: '/page-1',
					},
				},
				{
					json: {
						name: 'Page 2',
						url: '/page-2',
					},
				},
			]);
		});

		it('should return the raw response when rawResponse is true', async () => {
			// Given
			const rawResponse = {
				data: [
					{
						type: 'cms-pages',
						id: '1',
						attributes: { name: 'Page 1', url: '/page-1' },
						links: { self: 'http://localhost/cms-pages/1' },
					},
				],
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(rawResponse);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'additionalFields') {
					return { rawResponse: true };
				}
				return {};
			});

			// When
			const result = await cmsPageService.getMany();

			// Then
							expect(result).toEqual([{ json: rawResponse }]);
		});

		it('should return raw response if data is missing for getMany', async () => {
			// Given
			const rawResponse = { errors: [] }; // Response without a 'data' property
			(context.helpers.request as jest.Mock).mockResolvedValue(rawResponse);

			// When
			const result = await cmsPageService.getMany();

			// Then
			expect(result).toEqual([{ json: rawResponse }]);
		});
	});

	describe('getById', () => {
		it('should return raw response if data is missing for getById', async () => {
			// Given
			const rawResponse = { errors: [] }; // Response without a 'data' property
			(context.helpers.request as jest.Mock).mockResolvedValue(rawResponse);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'cmsPageId') {
					return '1';
				}
				return { additionalFields: {} };
			});

			// When
			const result = await cmsPageService.getById();

			// Then
			expect(result).toEqual([{ json: rawResponse }]);
		});
		it('should return a transformed CMS page when a valid ID is provided', async () => {
			// Given
			const response = {
				data: {
					type: 'cms-pages',
					id: '1',
					attributes: { name: 'Page 1', url: '/page-1' },
					links: { self: 'http://localhost/cms-pages/1' },
				},
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(response);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'cmsPageId') {
					return '1';
				}
				return { additionalFields: {} };
			});

			// When
			const result = await cmsPageService.getById();

			// Then
			expect(result).toEqual([
				{
					json: {
						id: '1',
						type: 'cms-pages',
						name: 'Page 1',
						url: '/page-1',
						links: { self: 'http://localhost/cms-pages/1' },
						_raw: response.data,
					},
				},
			]);
		});

		it('should return the raw response when rawResponse is true', async () => {
			// Given
			const rawResponse = {
				data: {
					type: 'cms-pages',
					id: '1',
					attributes: { name: 'Page 1', url: '/page-1' },
					links: { self: 'http://localhost/cms-pages/1' },
				},
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(rawResponse);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'cmsPageId') {
					return '1';
				}
				if (name === 'additionalFields') {
					return { rawResponse: true };
				}
				return {};
			});

			// When
			const result = await cmsPageService.getById();

			// Then
			expect(result).toEqual([{ json: rawResponse }]);
		});

		it('should return a transformed list of CMS pages with selected fields', async () => {
			// Given
			const response = {
				data: {
					type: 'cms-pages',
					id: '1',
					attributes: { name: 'Page 1', url: '/page-1', description: 'Desc 1' },
					links: { self: 'http://localhost/cms-pages/1' },
				},
			};
			(context.helpers.request as jest.Mock).mockResolvedValue(response);
			(context.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
				if (name === 'baseUrl') {
					return 'http://localhost';
				}
				if (name === 'cmsPageId') {
					return '1';
				}
				if (name === 'additionalFields') {
					return { fieldsToExtract: 'name,url' };
				}
				return {};
			});

			// When
			const result = await cmsPageService.getById();

			// Then
			expect(result).toEqual([
				{
					json: {
						name: 'Page 1',
						url: '/page-1',
					},
				},
			]);
		});
	});
});
