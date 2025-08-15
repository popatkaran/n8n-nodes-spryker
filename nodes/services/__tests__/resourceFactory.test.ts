
import { SprykerResourceFactory } from '../resourceFactory';
import { SprykerExecutionContext } from '../../types';
import { mock } from 'jest-mock-extended';
import { CmsPageService } from '../cmsPageService';

jest.mock('../cmsPageService');

describe('SprykerResourceFactory', () => {
	let context: SprykerExecutionContext;
	let resourceFactory: SprykerResourceFactory;

	beforeEach(() => {
		context = mock<SprykerExecutionContext>();
		resourceFactory = new SprykerResourceFactory(context, 0);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should throw an error for an unsupported resource', async () => {
		await expect(resourceFactory.executeOperation('unsupportedResource' as any, 'getAll')).rejects.toThrow(
			'Unsupported resource: unsupportedResource',
		);
	});

	describe('CMS Page Operations', () => {
		it('should call getMany on CmsPageService for getAll operation', async () => {
			await resourceFactory.executeOperation('cmsPages', 'getAll');
			expect(CmsPageService.prototype.getMany).toHaveBeenCalledTimes(1);
		});

		it('should call getById on CmsPageService for get operation', async () => {
			await resourceFactory.executeOperation('cmsPages', 'get');
			expect(CmsPageService.prototype.getById).toHaveBeenCalledTimes(1);
		});

		it('should throw an error for an unsupported CMS page operation', async () => {
			await expect(resourceFactory.executeOperation('cmsPages', 'unsupportedOperation' as any)).rejects.toThrow(
				'Unsupported CMS page operation: unsupportedOperation',
			);
		});
	});
});
