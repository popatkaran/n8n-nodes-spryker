import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// Helper function for getting CMS pages
async function getCmsPages(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const baseUrl = executeFunctions.getNodeParameter('baseUrl', itemIndex) as string;
	const additionalFields = executeFunctions.getNodeParameter('additionalFields', itemIndex) as any;

	// Build query parameters manually
	const queryParams: string[] = [];

	if (additionalFields.include) {
		queryParams.push(`include=${encodeURIComponent(additionalFields.include)}`);
	}

	if (additionalFields.pageSize) {
		queryParams.push(`page[limit]=${encodeURIComponent(additionalFields.pageSize.toString())}`);
	}

	if (additionalFields.pageNumber && additionalFields.pageNumber > 1) {
		const offset = (additionalFields.pageNumber - 1) * (additionalFields.pageSize || 20);
		queryParams.push(`page[offset]=${encodeURIComponent(offset.toString())}`);
	}

	// Build the URL
	let url = `${baseUrl.replace(/\/$/, '')}/cms-pages`;
	if (queryParams.length > 0) {
		url += `?${queryParams.join('&')}`;
	}

	const options: IRequestOptions = {
		method: 'GET' as IHttpRequestMethods,
		uri: url,
		headers: {
			'Accept': 'application/json',
			'Accept-Language': 'en', // Can be made configurable later
		},
		json: true,
	};

	// Add authentication if required
	const authentication = executeFunctions.getNodeParameter('authentication', itemIndex) as string;
	if (authentication === 'accessToken') {
		const credentials = await executeFunctions.getCredentials('sprykerApi');
		if (credentials && credentials.accessToken) {
			options.headers!['Authorization'] = `Bearer ${credentials.accessToken}`;
		}
	}

	try {
		const response = await executeFunctions.helpers.request(options);

		// Handle Spryker API response structure
		if (response && response.data) {
			// Convert each CMS page into a separate item
			return response.data.map((cmsPage: any) => ({
				json: {
					id: cmsPage.id,
					type: cmsPage.type,
					...cmsPage.attributes,
					links: cmsPage.links,
					// Include the full original object for reference
					_raw: cmsPage,
				},
			}));
		}

		// Fallback: return the raw response if structure is unexpected
		return [{ json: response }];

	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Spryker API request failed: ${error.message}`,
			{ itemIndex }
		);
	}
}

export class Spryker implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spryker',
		name: 'spryker',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Spryker Commerce Platform API',
		defaults: {
			name: 'Spryker',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'sprykerApi',
				required: false,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: 'https://glue.eu.spryker.local',
				required: true,
				description: 'The base URL of your Spryker API instance',
				placeholder: 'https://your-spryker-domain.com',
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Access Token',
						value: 'accessToken',
					},
				],
				default: 'none',
				description: 'Authentication method to use',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'CMS Page',
						value: 'cmsPages',
					},
					// Future resources can be added here:
					// {
					//     name: 'Products',
					//     value: 'products',
					// },
					// {
					//     name: 'Customers',
					//     value: 'customers',
					// },
				],
				default: 'cmsPages',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['cmsPages'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many CMS pages',
						action: 'Get many CMS pages',
					},
					// Future operations can be added here:
					// {
					//     name: 'Get',
					//     value: 'get',
					//     description: 'Get a specific CMS page',
					//     action: 'Get a CMS page',
					// },
				],
				default: 'getAll',
				required: true,
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['cmsPages'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Include',
						name: 'include',
						type: 'string',
						default: '',
						description: 'Comma-separated list of resources to include in the response',
						placeholder: 'cms-blocks,glossary-keys',
					},
					{
						displayName: 'Page Size',
						name: 'pageSize',
						type: 'number',
						default: 20,
						description: 'Number of items to return per page',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
					},
					{
						displayName: 'Page Number',
						name: 'pageNumber',
						type: 'number',
						default: 1,
						description: 'Page number to retrieve',
						typeOptions: {
							minValue: 1,
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		let responseData;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'cmsPages') {
					if (operation === 'getAll') {
						responseData = await getCmsPages(this, i);
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else {
					// @ts-ignore
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
