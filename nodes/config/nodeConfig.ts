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
					name: 'Create Review',
					value: 'createReview',
					description: 'Create a new review for an abstract product',
					action: 'Create a product review',
				},
				{
					name: 'Get Availabilities',
					value: 'getAvailabilities',
					description: 'Get availability information for an abstract product',
					action: 'Get abstract product availabilities',
				},
				{
					name: 'Get by ID',
					value: 'get',
					description: 'Get a specific abstract product by ID',
					action: 'Get an abstract product by ID',
				},
				{
					name: 'Get Images',
					value: 'getImages',
					description: 'Get image sets for an abstract product',
					action: 'Get abstract product images',
				},
				{
					name: 'Get Prices',
					value: 'getPrices',
					description: 'Get prices for an abstract product',
					action: 'Get abstract product prices',
				},
				{
					name: 'Get Related Products',
					value: 'getRelatedProducts',
					description: 'Get related products for an abstract product',
					action: 'Get related products',
				},
				{
					name: 'Get Review',
					value: 'getReview',
					description: 'Get a specific review for an abstract product',
					action: 'Get a specific product review',
				},
				{
					name: 'Get Reviews',
					value: 'getReviews',
					description: 'Get all reviews for an abstract product',
					action: 'Get abstract product reviews',
				},
				{
					name: 'Get Tax Sets',
					value: 'getTaxSets',
					description: 'Get tax sets for an abstract product',
					action: 'Get abstract product tax sets',
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
					operation: ['get', 'getPrices', 'getAvailabilities', 'getRelatedProducts', 'getImages', 'getTaxSets', 'getReviews', 'getReview', 'createReview'],
				},
			},
			default: '',
			description: 'The ID/SKU of the abstract product to retrieve',
			placeholder: '001',
		},
		{
			displayName: 'Product Review ID',
			name: 'productReviewId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['getReview'],
				},
			},
			default: '',
			description: 'The ID of the product review to retrieve',
			placeholder: '26',
		},
		{
			displayName: 'Rating',
			name: 'rating',
			type: 'number',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['createReview'],
				},
			},
			default: 5,
			description: 'Rating for the product (1-5)',
			typeOptions: {
				minValue: 1,
				maxValue: 5,
			},
		},
		{
			displayName: 'Nickname',
			name: 'nickname',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['createReview'],
				},
			},
			default: '',
			description: 'Reviewer nickname',
			placeholder: 'John Doe',
		},
		{
			displayName: 'Summary',
			name: 'summary',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['createReview'],
				},
			},
			default: '',
			description: 'Review summary',
			placeholder: 'Great product!',
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['createReview'],
				},
			},
			default: '',
			description: 'Detailed review description',
			placeholder: 'This product exceeded my expectations...',
			typeOptions: {
				rows: 4,
			},
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
					operation: ['get', 'getPrices', 'getAvailabilities', 'getRelatedProducts', 'getImages', 'getTaxSets', 'getReview'],
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
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: {
				show: {
					resource: ['abstractProducts'],
					operation: ['getReviews'],
				},
			},
			options: [
				{
					displayName: 'Fields to Extract',
					name: 'fieldsToExtract',
					type: 'string',
					default: '',
					description: 'Comma-separated list of fields to extract from the response',
					placeholder: 'rating,nickname,summary,description',
				},
				{
					displayName: 'Include',
					name: 'include',
					type: 'string',
					default: '',
					description: 'Comma-separated list of resources to include in the response',
					placeholder: 'concrete-products,product-labels',
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
					displayName: 'Page Size',
					name: 'pageSize',
					type: 'number',
					default: 10,
					description: 'Number of reviews to return per page',
					typeOptions: {
						minValue: 1,
						maxValue: 100,
					},
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
					operation: ['createReview'],
				},
			},
			options: [
				{
					displayName: 'Fields to Extract',
					name: 'fieldsToExtract',
					type: 'string',
					default: '',
					description: 'Comma-separated list of fields to extract from the response',
					placeholder: 'ID,rating,nickname,summary',
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
