import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export const sprykerNodeConfig: INodeTypeDescription = {
	displayName: 'Spryker',
	name: 'spryker',
	icon: 'file:spryker.svg',
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
				{
					name: 'Abstract Product',
					value: 'abstractProducts',
				},
				// Future resources can be added here:
				// {
				//     name: 'Concrete Products',
				//     value: 'concreteProducts',
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
				{
					name: 'Get by ID',
					value: 'get',
					description: 'Get a specific CMS page by ID',
					action: 'Get a CMS page by ID',
				},
			],
			default: 'getAll',
			required: true,
		},
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
				},
			},
			options: [
				{
					name: 'Get by ID',
					value: 'get',
					description: 'Get a specific abstract product by ID',
					action: 'Get an abstract product by ID',
				},
			],
			default: 'get',
			required: true,
		},
		{
			displayName: 'CMS Page ID',
			name: 'cmsPageId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['cmsPages'],
					operation: ['get'],
				},
			},
			default: '',
			description: 'The ID of the CMS page to retrieve',
			placeholder: '10014bd9-4bba-5a54-b84f-31b4b7efd064',
		},
		{
			displayName: 'Abstract Product ID',
			name: 'abstractProductId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['get'],
				},
			},
			default: '',
			description: 'The ID/SKU of the abstract product to retrieve',
			placeholder: '001',
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
				{
					displayName: 'Fields to Extract',
					name: 'fieldsToExtract',
					type: 'string',
					default: '',
					description: 'Comma-separated list of fields to extract from the response',
					placeholder: 'name,url',
				},
				{
					displayName: 'Raw Response',
					name: 'rawResponse',
					type: 'boolean',
					default: false,
					description: 'Whether to return the raw response from the API',
				},
			],
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
					operation: ['get'],
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
					displayName: 'Fields to Extract',
					name: 'fieldsToExtract',
					type: 'string',
					default: '',
					description: 'Comma-separated list of fields to extract from the response',
					placeholder: 'name,url',
				},
				{
					displayName: 'Raw Response',
					name: 'rawResponse',
					type: 'boolean',
					default: false,
					description: 'Whether to return the raw response from the API',
				},
			],
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['get'],
				},
			},
			options: [
				{
					displayName: 'Include',
					name: 'include',
					type: 'string',
					default: '',
					description: 'Comma-separated list of resources to include in the response',
					placeholder: 'concrete-products,product-labels',
				},
				{
					displayName: 'Fields to Extract',
					name: 'fieldsToExtract',
					type: 'string',
					default: '',
					description: 'Comma-separated list of fields to extract from the response',
					placeholder: 'sku,name,description,averageRating',
				},
				{
					displayName: 'Raw Response',
					name: 'rawResponse',
					type: 'boolean',
					default: false,
					description: 'Whether to return the raw response from the API',
				},
			],
		},
	],
};
