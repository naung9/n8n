import * as xmlrpc from 'xmlrpc';

// tslint:disable-next-line:no-any
export function authenticate(client: xmlrpc.Client, dbName: string, userName: string, password: string): Promise<any>{
	// tslint:disable-next-line:no-any
	return new Promise<any>((resolve, reject) => {
		client.methodCall('authenticate', [dbName, userName, password, {}], ((error, value) => {
			if(error)reject(error);
			else resolve(value);
		}));
	});
}

// tslint:disable-next-line:no-any
export function executeRead(client: xmlrpc.Client, dbName: string, userId: number, password: string, modelName: string, operation: string, conditions?: any[], fields?: any[], limit?: number): Promise<any>{
	// tslint:disable-next-line:no-any
	return new Promise<any>((resolve, reject) => {
		const params: any[] = [dbName, userId, password, modelName, operation];
		if(conditions) params.push([conditions.map((condition: {field:string, operation:string, value:string, dataType:string}) => [condition.field, condition.operation, convertStringToType(condition.value, condition.dataType)])]);
		else params.push([[]]);
		let additionalParams: any = {};
		if(fields && fields.length > 0){
			additionalParams["fields"] = fields;
		}
		if(limit){
			additionalParams["limit"] = limit;
		}
		if(!(Object.keys(additionalParams).length === 0 && additionalParams.constructor === Object)){
			params.push(additionalParams);
		}
		console.log('Final Params', params);
		// tslint:disable-next-line:no-any
		client.methodCall('execute_kw', params, ((error, value) => {
			if(error)reject(error);
			resolve(value);
		}));
	});
}

export function getFields(client: xmlrpc.Client, dbName: string, userId: number, password: string, modelName: string): Promise<any>{
	return new Promise<any>((resolve, reject)=>{
		client.methodCall('execute_kw', [dbName, userId, password, modelName, 'fields_get', [], {'attributes': ['string', 'help', 'type']}], (error, value)=>{
			if(error)reject(error);
			resolve(value);
		})
	});
}

// tslint:disable-next-line:no-any
export function executeWrite(client: xmlrpc.Client, dbName: string, userId: number, password: string, modelName: string, operation: string, data: object, id?: number): Promise<any>{
	let params : any[] = [];
	switch(operation){
		case 'create': params.push(data); break;
		case 'write': 
			if(id)params.push([+id], data);
			else throw new Error("ID is required to perform update operation");
			break;
		case 'unlink':
			if(id)params.push([+id]);
			else throw new Error("ID is required to perform update operation");
			break;
	}
	// tslint:disable-next-line:no-any
	return new Promise<any>((resolve, reject) => {
		client.methodCall('execute_kw', [dbName, userId, password, modelName, operation, params], ((error, value) => {
			if(error)reject(error);
			resolve(value);
		}));
	});
}

export function convertStringToType(data: string, type: string): string | boolean | number {
	console.log(data, type);
	switch(type.trim().toLowerCase()){
		case 'string': return data;
		case 'boolean': return !data || data.trim().toLowerCase() === 'false' ? false : true;
		case 'number': return +data;
		default: return data;
	}
}