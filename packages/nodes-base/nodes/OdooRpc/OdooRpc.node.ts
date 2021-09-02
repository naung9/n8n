import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeParameters,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import * as xmlrpc from 'xmlrpc';
import { sortOptions } from '../Salesforce/GenericFunctions';
import {authenticate, convertStringToType, executeRead, executeWrite, getFields} from './RpcHelpers';

export class OdooRpc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OdooRpc',
		name: 'odooRpc',
		icon: 'file:odooRpc.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume Odoo Rpc API',
		defaults: {
			name: 'OdooRpc',
			color: '#1A82e2',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'odooRpcApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Custom Model',
						value: 'customModel',
					},
				],
				default: 'customModel',
				required: true,
				description: 'Resource to consume',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Search Read',
						value: 'search_read',
					},
					{
						name: 'Read',
						value: 'read',
					},
					{
						name: 'Write/Update',
						value: 'write',
					},
					{
						name: 'Create',
						value: 'create',
					},
					{
						name: 'Delete',
						value: 'unlink',
					},
					{
						name: 'Search',
						value: 'search',
					},
					{
						name: 'Search Count',
						value: 'search_count',
					},
				],
				default: 'search_read',
				description: 'The operation to perform.',
			},
			{
				displayName: 'Model Name',
				name: 'modelName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'customModel',
						],
					},
				},
				default:'',
				description:'Custom Model\'s Name',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: false,
				displayOptions: {
					show: {
						operation: [
							'write',
							'unlink'
						],
					},
				},
				default:'',
				description:'ID of object to update or delete',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				required: false,
				default: 0,
				description: 'Limit the amount of results. 0 to retrieve all results',
				displayOptions: {
					show: {
						operation: [
							'search',
							'search_read',
							'read',
						],
					},
				},
			},
			{
				displayName: 'Search Fields',
				name: 'searchFields',
				type: 'collection',
				placeholder: 'Add Fields Or Conditions',
				displayOptions: {
					show: {
						operation: [
							'search',
							'search_read',
							'read',
						],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Search Field',
						name: 'searchField',
						typeOptions: {
							multipleValues: true,
						},
						type: 'string',
						default: '',
					},
					{
						displayName: 'Conditions',
						name: 'conditions',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Set conditions for method',
						options: [
							{
								name: 'conditionValues',
								displayName: 'Condition Values',
								values: [
									{
										displayName: 'Field',
										name: 'field',
										type: 'string',
										default: '',
										description: 'Field Name',
									},
									{
										displayName: 'Operation',
										name: 'operation',
										type: 'string',
										// options: [
										// 	{
										// 		name: '=',
										// 		value: '=',
										// 	},
										// 	{
										// 		name: '!=',
										// 		value: '!=',
										// 	},
										// 	{
										// 		name: '>',
										// 		value: '>',
										// 	},
										// 	{
										// 		name: '<',
										// 		value: '<',
										// 	},
										// 	{
										// 		name: '>=',
										// 		value: '>=',
										// 	},
										// 	{
										// 		name: '<=',
										// 		value: '<=',
										// 	},
										// ],
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Data Type',
										name: 'dataType',
										type: 'options',
										options: [
											{
												name: 'String',
												value: 'string',
											},
											{
												name: 'Number',
												value: 'number',
											},
											{
												name: 'Boolean',
												value: 'boolean',
											},
											{
												name: 'DateTime',
												value: 'dateTime',
											},
										],
										default: 'string',
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Parameters',
				name: 'parameters',
				type: 'collection',
				placeholder: 'Add Parameter',
				default: {},
				displayOptions: {
					show: {
						operation: [
							'write',
							'create',
						],
					},
				},
				options: [
					{
						displayName: 'Parameters',
						name: 'parameters',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: '',
						description: 'Set parameters for method',
						options:[
							{
								name: 'parameterValues',
								displayName: 'Parameter Values',
								values: [
									{
										displayName: 'Parameter Field Name',
										name: 'fieldName',
										type: 'options',
										default: '',
										description: 'Field name of parameter',
										typeOptions:{
											loadOptionsMethod: 'loadFieldOptions',
											loadOptionsDependsOn: ['modelName'],
										}
									},
									{
										displayName: 'Parameter Data Type',
										name: 'dataType',
										type: 'options',
										options: [
											{
												name: 'String',
												value: 'string',
											},
											{
												name: 'Number',
												value: 'number',
											},
											{
												name: 'Boolean',
												value: 'boolean',
											},
											{
												name: 'DateTime',
												value: 'dateTime',
											},
										],
										default: 'string',
									},
									{
										displayName: 'Parameter Value',
										name: 'parameterValue',
										type: 'string',
										default: '',
										description: 'Value of parameter',
									},
								],
							},
						],
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async loadFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>{
				const results : INodePropertyOptions[] = [];
				const modelName = this.getCurrentNodeParameter('modelName') as string;
				const credentials = await this.getCredentials('odooRpcApi') as IDataObject;
				const dbName = credentials.dbName as string;
				const userName = credentials.userName as string;
				const password = credentials.password as string;
				const authClient = xmlrpc.createClient({host: credentials.host as string, port: credentials.Port as number, path: credentials.authPath as string});
				const rpcClient = xmlrpc.createClient({host: credentials.host as string, port: credentials.Port as number, path: credentials.path as string});
				const authResult = await authenticate(authClient, dbName, userName, password);
				const fieldResults: any = await getFields(rpcClient, dbName, authResult, password, modelName);
				for(const field in fieldResults){
					results.push({name: fieldResults[field]["string"], value: field, description: fieldResults[field]["help"]})
				}
				sortOptions(results);
				console.log(fieldResults);
				return results;
			}
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// let responseData;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		//Get credentials the user provided for this node
		const credentials = await this.getCredentials('odooRpcApi') as IDataObject;
		const dbName = credentials.dbName as string;
		const userName = credentials.userName as string;
		const password = credentials.password as string;
		console.log(this.getInputData());
		const authClient = xmlrpc.createClient({host: credentials.host as string, port: credentials.Port as number, path: credentials.authPath as string});
		const rpcClient = xmlrpc.createClient({host: credentials.host as string, port: credentials.Port as number, path: credentials.path as string});
		const authResult = await authenticate(authClient, dbName, userName, password);
		console.log(authResult);
		let result : any = [[]];
		if (resource === 'customModel') {
			const modelName = this.getNodeParameter('modelName', 0) as string;
			if (operation === 'search_read' || operation === 'search' || operation === 'read') {
				const limit = this.getNodeParameter('limit', 0) as number;
				const searchFields = this.getNodeParameter('searchFields', 0) as INodeParameters;
				let fieldsArr : any[] = [];
				let conditionValuesArr : any[] = [];
				if(searchFields){
					if(searchFields.searchField)fieldsArr = searchFields.searchField as any[];
					const conditions = searchFields.conditions as IDataObject;
					if(conditions)conditionValuesArr = conditions.conditionValues as any[];
				}
				console.log(fieldsArr, conditionValuesArr);
				result = await executeRead(rpcClient, dbName, authResult, password, modelName, operation, conditionValuesArr.length >0 ? conditionValuesArr : undefined, fieldsArr.length > 0 ? fieldsArr : undefined, limit > 0 ? limit : undefined);
			}
			else if(operation === 'create' || operation === 'write' || operation === 'unlink'){
				let id = '';
				if(operation !== 'create'){
					id = this.getNodeParameter('id', 0) as string;
				}
				let paramsArr : any[] = [];
				if(operation !== 'unlink'){
					const parameters = this.getNodeParameter('parameters', 0) as INodeParameters;
					if(parameters){
						const params = parameters.parameters as IDataObject;
						if(params) paramsArr = params.parameterValues as any[];
					}
				}
				console.log(paramsArr);
				const data : any = {};
				for(let param of paramsArr){
					data[param["fieldName"]] = convertStringToType(param["parameterValue"].toString(), param["dataType"]);
				}
				console.log(data);
				result = await executeWrite(rpcClient, dbName, authResult, password, modelName, operation, data, id ? +id : undefined);
				if(result)result = {result};
			}
		}
		// Map data to n8n data
		return [this.helpers.returnJsonArray(result)];
	}
}
