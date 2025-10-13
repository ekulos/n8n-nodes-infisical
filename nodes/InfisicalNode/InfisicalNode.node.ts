import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// Polyfills per compatibilità con l'ambiente n8n
import 'web-streams-polyfill/polyfill';
import fetch from 'node-fetch';

// Type casting per evitare errori TypeScript
declare const globalThis: {
	fetch?: typeof fetch;
	Blob?: any;
	[key: string]: any;
};

// Aggiungi fetch globalmente se non esiste
if (!globalThis.fetch) {
	(globalThis as any).fetch = fetch;
}

// Polyfill per Blob se non esiste
if (!globalThis.Blob) {
	(globalThis as any).Blob = class MockBlob {
		constructor(parts: any[], options?: any) {
			// Mock implementation minima
		}
	};
}

// Import dinamico per evitare errori di TypeScript
const InfisicalSDK = require('@infisical/sdk').InfisicalSDK;

interface InfisicalCredentials {
	host: string;
	token: string;
	cache_ttl?: number;
	environment_slug: string;
	project_slug: string;
}

export class InfisicalNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Infisical',
		name: 'infisical',
		icon: 'file:infisical.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["serviceName"] || "Retrieve secrets"}}',
		description: 'Retrieve secrets from Infisical',
		defaults: {
			name: 'Infisical',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'infisicalApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Service Name',
				name: 'serviceName',
				type: 'string',
				default: '',
				placeholder: 'database',
				description: 'The service name to retrieve credentials for (e.g., database, api, email)',
				required: true,
			},
			{
				displayName: 'Secret Path',
				name: 'secretPath',
				type: 'string',
				default: '/',
				description: 'The path where secrets are stored (default: /)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('infisicalApi') as InfisicalCredentials;

		const results: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const serviceName = this.getNodeParameter('serviceName', i) as string;
				const secretPath = this.getNodeParameter('secretPath', i, '/') as string;

				if (!serviceName) {
					throw new NodeOperationError(this.getNode(), 'Service Name is required', { itemIndex: i });
				}

				// Validate required credentials
				if (!credentials.host || !credentials.token || !credentials.environment_slug || !credentials.project_slug) {
					throw new NodeOperationError(this.getNode(), 'Missing required Infisical credentials', { itemIndex: i });
				}

				// Create Infisical client with correct authentication method
				const infisical = new InfisicalSDK({
					siteUrl: credentials.host.replace(/\/$/, ''),
				});
				
				// Authenticate using accessToken method
				infisical.auth().accessToken(credentials.token);

				// Try to get the secret directly by service name
				let secretData;
				try {
					secretData = await infisical.secrets().getSecret({
						environment: credentials.environment_slug,
						projectId: credentials.project_slug,
						secretPath: secretPath,
						secretName: serviceName,
					});
				} catch (error: any) {
					// If exact service name fails, try common variations
					const variations = [
						serviceName.toLowerCase(),
						serviceName.toUpperCase(),
						`${serviceName.toLowerCase()}_account`,
						`${serviceName.toUpperCase()}_ACCOUNT`,
						`${serviceName.toLowerCase()}_config`,
						`${serviceName.toUpperCase()}_CONFIG`,
						`${serviceName.toLowerCase()}_credentials`,
						`${serviceName.toUpperCase()}_CREDENTIALS`,
					];

					for (const variation of variations) {
						try {
							secretData = await infisical.secrets().getSecret({
								environment: credentials.environment_slug,
								projectId: credentials.project_slug,
								secretPath: secretPath,
								secretName: variation,
							});
							break; // Found it!
						} catch {
							// Continue trying other variations
						}
					}

					if (!secretData) {
						throw new NodeOperationError(this.getNode(), `No secret found for service '${serviceName}' or its variations in path '${secretPath}'`, { itemIndex: i });
					}
				}

				// Process the found secret
				const output: any = {};
				
				if (secretData) {
					// The secret data is directly in the response, not nested under .secret
					const secret = secretData;
					
					// Try to parse the secret value as JSON if it looks like structured data
					try {
						let jsonValue = secret.secretValue;
						
						// Fix common JSON formatting issues
						if (jsonValue.startsWith('{') && jsonValue.includes('"') && !jsonValue.endsWith('}')) {
							jsonValue = jsonValue + '}';
						}
						if (jsonValue.includes('{username"')) {
							jsonValue = jsonValue.replace('{username"', '{"username"');
						}
						
						const parsedValue = JSON.parse(jsonValue);
						if (typeof parsedValue === 'object' && parsedValue !== null) {
							// If it's a JSON object, use its properties directly
							Object.assign(output, parsedValue);
						} else {
							// If it's a simple JSON value, use the secret key
							output[secret.secretKey] = parsedValue;
						}
					} catch {
						// Not JSON or malformed JSON, use as-is
						output[secret.secretKey] = secret.secretValue;
					}
				}

				results.push({
					json: output,
					pairedItem: { item: i },
				});

			} catch (error) {
				if (this.continueOnFail()) {
					results.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [results];
	}
}