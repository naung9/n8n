import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class OdooRpcApi implements ICredentialType {
	name = 'odooRpcApi';
	displayName = 'Odoo Rpc API';
	documentationUrl = 'odooRpc';
	properties = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Port',
			name: 'Port',
			type: 'number' as NodePropertyTypes,
			default: '/xmlrpc/2/object',
		},
		{
			displayName: 'Path For Auth',
			name: 'authPath',
			type: 'string' as NodePropertyTypes,
			default: '/xmlrpc/2/common',
		},
		{
			displayName: 'Path',
			name: 'path',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Database Name',
			name: 'dbName',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'User Name',
			name: 'userName',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			typeOptions: {
				password: true,
			},
			type: 'string' as NodePropertyTypes,
			default: '',
		},
	];
}
