import {
	OptionsWithUri,
} from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	IDataObject,
} from 'n8n-workflow';

export function validateJSON(json: string | undefined): any { // tslint:disable-line:no-any
	let result;
	try {
		result = JSON.parse(json!);
	} catch (exception) {
		result = undefined;
	}
	return result;
}

export async function getABIfromEtherscan(this: IHookFunctions | ILoadOptionsFunctions | IExecuteFunctions | IExecuteSingleFunctions, 
                                          contractAddress: string): Promise<any> { // tslint:disable-line:no-any
         
    let method = 'GET';
    let qs = {'module': "contract", 'action': "getabi", 'address': contractAddress};
    let body = {};
    let uri = "https://api.etherscan.io/api";

    let options: OptionsWithUri = {
        headers: {},
        method,
        qs,
        body,
        uri: uri,
        json: true,
    };


	try {
		let response = await this.helpers.request!(options);
        return JSON.parse(response.result);

	} catch (error) {
		throw error;
	}
}


export async function ethCallRequest(this: IHookFunctions | ILoadOptionsFunctions | IExecuteFunctions | IExecuteSingleFunctions, 
                                     ETHNetwork: string, 
                                     ProjectID: string,
                                     smartContractAddress: string,
                                     walletAddress: string,
                                     data: string): Promise<any> { // tslint:disable-line:no-any                                                                                     
       
    let method = 'POST';
    let qs = {};
    let body = {
        "method" : "eth_call",
        "id" : 1,
        "jsonrpc" : "2.0",
        "params" : [
        { 
            "to"   : smartContractAddress, 
            "from" : walletAddress,         
            "data" : data, /* 32 bytes block with the initial 4-byte being the signature */
        }, 
        "latest"
        ]
    };
    let uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;

    let options: OptionsWithUri = {
        headers: {},
        method,
        qs,
        body,
        uri: uri,
        json: true,
    };
    
	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw error;
	}
}

export async function ethSendRawTransaction(this: IHookFunctions | ILoadOptionsFunctions | IExecuteFunctions | IExecuteSingleFunctions, 
                                     ETHNetwork: string, 
                                     ProjectID: string,
                                     signedTransaction: string): Promise<any> { // tslint:disable-line:no-any     

    let method = 'POST';
    let qs = {};
    let body = {
        "method" : "eth_sendRawTransaction",
        "id" : 1,
        "jsonrpc" : "2.0",
        "params" : [signedTransaction], 
    }   

    let uri = `https://${ETHNetwork}.infura.io/v3/${ProjectID}`;

    let options: OptionsWithUri = {
        headers: {},
        method,
        qs,
        body,
        uri: uri,
        json: true,
    };
    
    try {
        return await this.helpers.request!(options);
    } catch (error) {
        throw error;
    }
}