import { INodeExecutionData } from 'n8n-workflow';
import { SprykerExecutionContext, SprykerResource, SprykerOperation } from '../types';
import { CmsPageService } from './cmsPageService';
import { AbstractProductService } from './abstractProductService';

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
			case 'abstractProducts':
				return this.handleAbstractProductOperations(operation);
			// Future resources can be added here:
			// case 'concreteProducts':
			//     return this.handleConcreteProductOperations(operation);
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

	private async handleAbstractProductOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
		const abstractProductService = new AbstractProductService(this.context, this.itemIndex);

		switch (operation) {
			case 'get':
				return abstractProductService.getById();
			default:
				throw new Error(`Unsupported abstract product operation: ${operation}`);
		}
	}

	// Future resource handlers can be added here:
	// private async handleConcreteProductOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
	//     // Concrete product service logic
	// }

	// private async handleCustomerOperations(operation: SprykerOperation): Promise<INodeExecutionData[]> {
	//     // Customer service logic
	// }
}
