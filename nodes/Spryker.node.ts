import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
} from 'n8n-workflow';

import { sprykerNodeConfig } from './config/nodeConfig';
import { SprykerResourceFactory } from './services/resourceFactory';
import { SprykerResource, SprykerOperation, SprykerExecutionContext } from './types';

export class Spryker implements INodeType {
	description = sprykerNodeConfig;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as SprykerResource;
		const operation = this.getNodeParameter('operation', 0) as SprykerOperation;

		// Create execution context adapter
		const context: SprykerExecutionContext = {
			getNodeParameter: this.getNodeParameter.bind(this),
			getCredentials: this.getCredentials.bind(this),
			helpers: this.helpers,
			getNode: this.getNode.bind(this),
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const resourceFactory = new SprykerResourceFactory(context, i);
				const responseData = await resourceFactory.executeOperation(resource, operation);

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else {
					returnData.push({ json: responseData });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
