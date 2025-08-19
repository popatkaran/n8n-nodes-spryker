import {
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
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Your Spryker customer username/email',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Spryker customer password',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://glue.eu.spryker.local',
			description: 'Base URL of your Spryker API instance',
			placeholder: 'https://your-spryker-domain.com',
			required: true,
		},
	];

	// Enhanced credential test with better error handling
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
			timeout: 30000,
			skipSslCertificateValidation: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'data.type',
					value: 'access-tokens',
					message: 'Authentication successful! Access token retrieved.',
				},
			},
		],
	};
}
