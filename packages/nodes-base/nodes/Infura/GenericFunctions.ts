import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions
} from 'n8n-core';

import {
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

export async function getABIfromEtherscan(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	contractAddress: string
): Promise<any> {
	// tslint:disable-line:no-any

	const method = 'GET';
	const qs = { module: 'contract', action: 'getabi', address: contractAddress };
	const body = {};
	const uri = 'https://api.etherscan.io/api';

	const options: OptionsWithUri = {
		headers: {},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		const response = await this.helpers.request!(options);
		return JSON.parse(response.result);
	} catch (error) {
		throw error;
	}
}

export async function ethCallRequest(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	ETHNetwork: string,
	ProjectID: string,
	smartContractAddress: string,
	walletAddress: string,
	data: string,
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const method = 'POST';
	const qs = {};
	const body = {
		method: 'eth_call',
		id: 1,
		jsonrpc: '2.0',
		params: [
			{
				to: smartContractAddress,
				from: walletAddress,
				data: data /* 32 bytes block with the initial 4-byte being the signature */
			},
			'latest'
		]
	};
	const uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;
	const basicAuthKey = Buffer.from(`${credentials.projectSecret}`).toString('base64');

	const options: OptionsWithUri = {
		headers: {
			'Authorization' : `Basic ${basicAuthKey}`
		},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}

export async function ethSendRawTransaction(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	ETHNetwork: string,
	ProjectID: string,
	signedTransaction: string
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}	

	const method = 'POST';
	const qs = {};
	const body = {
		method: 'eth_sendRawTransaction',
		id: 1,
		jsonrpc: '2.0',
		params: [signedTransaction]
	};

	const uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;
	const basicAuthKey = Buffer.from(`${credentials.projectSecret}`).toString('base64');

	const options: OptionsWithUri = {
		headers: {
			'Authorization' : `Basic ${basicAuthKey}`
		},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}

export async function ethGetTransactionCount(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	ETHNetwork: string,
	ProjectID: string,
	address: string,
	tag: string = "pending",
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const method = 'POST';
	const qs = {};
	const body = {
		method: 'eth_getTransactionCount',
		id: 1,
		jsonrpc: '2.0',
		params: [address, tag]
	};

	const uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;
	const basicAuthKey = Buffer.from(`${credentials.projectSecret}`).toString('base64');

	const options: OptionsWithUri = {
		headers: {
			'Authorization' : `Basic ${basicAuthKey}`
		},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}

export async function ethBlockNumber(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	ETHNetwork: string,
	ProjectID: string
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const method = 'POST';
	const qs = {};
	const body = {
		method: 'eth_blockNumber',
		id: 1,
		jsonrpc: '2.0',
		params: [],
	};

	const uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;
	const basicAuthKey = Buffer.from(`${credentials.projectSecret}`).toString('base64');

	const options: OptionsWithUri = {
		headers: {
			'Authorization' : `Basic ${basicAuthKey}`
		},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}

export async function ethGetBlockByNumber(
	this:
		| IHookFunctions
		| ILoadOptionsFunctions
		| IExecuteFunctions
		| IExecuteSingleFunctions,
	ETHNetwork: string,
	ProjectID: string,
	blockNumber: number,
	showTransactionDetails: boolean,
): Promise<any> {
	// tslint:disable-line:no-any
	const credentials = this.getCredentials('InfuraAPI');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const method = 'POST';
	const qs = {};
	const body = {
		method: 'eth_getBlockByNumber',
		id: 1,
		jsonrpc: '2.0',
		params: [blockNumber, showTransactionDetails],
	};

	const uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;
	const basicAuthKey = Buffer.from(`${credentials.projectSecret}`).toString('base64');

	const options: OptionsWithUri = {
		headers: {
			'Authorization' : `Basic ${basicAuthKey}`
		},
		method,
		qs,
		body,
		uri: uri,
		json: true
	};

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}
