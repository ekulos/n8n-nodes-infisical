import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InfisicalApi implements ICredentialType {
	name = 'infisicalApi';
	displayName = 'Infisical API';
	documentationUrl = 'https://infisical.com/docs/api-reference/overview/introduction';
	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'https://app.infisical.com',
			placeholder: 'https://app.infisical.com',
			description: 'The URL of your Infisical instance',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'Bearer token or Service token',
			description: 'Infisical access token or service token for authentication (Bearer token format)',
			required: true,
		},
		{
			displayName: 'Project ID',
			name: 'project_slug',
			type: 'string',
			default: '',
			placeholder: '83d483a7-5187-43cb-a52b-1d930285bd4e',
			description: 'The Project ID (workspace UUID) of the Infisical project - found in project settings',
			required: true,
		},
		{
			displayName: 'Environment Slug',
			name: 'environment_slug',
			type: 'string',
			default: 'dev',
			placeholder: 'dev',
			description: 'The slug of the environment (e.g., dev, staging, prod)',
			required: true,
		},
		{
			displayName: 'Cache TTL (seconds)',
			name: 'cache_ttl',
			type: 'number',
			default: 300,
			description: 'How long to cache retrieved secrets in seconds (default: 300)',
			required: false,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.host}}',
			url: '/api/v1/auth/universal-auth/login',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				clientSecret: '={{$credentials.token}}',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: 'Connection successful',
					key: 'success',
					value: true,
				},
			},
		],
	};
}