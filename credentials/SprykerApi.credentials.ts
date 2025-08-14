import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SprykerApi implements ICredentialType {
	name = 'sprykerApi';
	displayName = 'Spryker API';
	documentationUrl = 'https://docs.spryker.com/docs/scos/dev/glue-api-guides/';
	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'Access Token',
					value: 'accessToken',
				},
				{
					name: 'Username & Password',
					value: 'credentials',
				},
			],
			default: 'accessToken',
			description: 'Method to authenticate with Spryker API',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: {
				show: {
					authMethod: ['accessToken'],
				},
			},
			description: 'The access token for Spryker API authentication',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authMethod: ['credentials'],
				},
			},
			description: 'Username for Spryker authentication',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: {
				show: {
					authMethod: ['credentials'],
				},
			},
			description: 'Password for Spryker authentication',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://glue.eu.spryker.local',
			description: 'Base URL of your Spryker API instance',
			placeholder: 'https://your-spryker-domain.com',
		},
	];

	// Test the credentials by attempting to get an access token or validate existing token
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/access-tokens',
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				data: {
					type: 'access-tokens',
					attributes: {
						username: '={{$credentials.username}}',
						password: '={{$credentials.password}}',
					},
				},
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'data.type',
					value: 'access-tokens',
					message: '',
				},
			},
		],
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};
}
