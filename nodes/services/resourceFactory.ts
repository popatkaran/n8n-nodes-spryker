import { INodeExecutionData } from 'n8n-workflow';
import { SprykerExecutionContext, SprykerResource, SprykerOperation } from '../types';
import { CmsPageService } from './cmsPageService';

export class SprykerResourceFactory {
	private context: SprykerExecutionContext;
	private itemIndex: number;

	constructor(context: SprykerExecutionContext, itemIndex: number) {
		this.context = context;
		this.itemIndex = itemIndex;
	}

	async executeOperation(resource: SprykerResource, operation: SprykerOperation): Promise<INodeExecutionData[]> {
		switch (resource) {
			case 'cmsPages':
				return this.handleCmsPageOperations(operation);
			// Future resources can be added here:
			// case 'products':
			//     return this.handleProductOperations(operation);
			// case 'customers':
			//     return this.handleCustomerOperations(operation);
			default:
				throw new Error(`Unsupported resource: ${resource}`);
		}
	}

	private async handleCmsPageOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
		const cmsPageService = new CmsPageService(this.context, this.itemIndex);

		switch (operation) {
			case 'getAll':
				return cmsPageService.getMany();
			case 'get':
				return cmsPageService.getById();
			default:
				throw new Error(`Unsupported CMS page operation: ${operation}`);
		}
	}

	// Future resource handlers can be added here:
	// private async handleProductOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
	//     // Product service logic
	// }

	// private async handleCustomerOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
	//     // Customer service logic
	// }
}
