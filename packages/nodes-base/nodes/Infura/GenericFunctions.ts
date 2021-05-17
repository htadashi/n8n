import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions
} from 'n8n-core';

import {
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

export function validateJSON(json: string | undefined): any {
	// tslint:disable-line:no-any
	let result;
	try {
		result = JSON.parse(json!);
	} catch (exception) {
		result = undefined;
	}
	return result;
}

export async function infuraApiRequest(this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions, body: any = {}, uri: string): Promise<any> { // tslint:disable-line:no-any
	try {
		const credentials = this.getCredentials('InfuraAPI');
		if (credentials === undefined) {
			throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
		}
		let options: OptionsWithUri = {
			method: 'POST',
			qs : {},
			body,
			uri: uri,
			json: true,
			auth: {
				'user' : '',
				'pass' : credentials.projectSecret.toString()
			},
		};
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function getNonce(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	address: string,
	uri: string,
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');
	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const body = {
		method: 'eth_getTransactionCount',
		id: 1,
		jsonrpc: '2.0',
		params: [address, 'latest']
	};

	const options: OptionsWithUri = {
		method : 'POST',
		qs : {},
		body,
		uri: uri,
		json: true,
		auth: {
			'user' : '',
			'pass' : credentials.projectSecret.toString()
		},		
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}
