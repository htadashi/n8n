import {
    IExecuteFunctions,
    ILoadOptionsFunctions,
} from 'n8n-core';

import {
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    INodePropertyOptions,
} from 'n8n-workflow';

import {
    infuraApiRequest,
    getNonce,
    validateJSON,
} from './GenericFunctions'

import { ethers } from "ethers";

export class Infura implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Infura',
        name: 'infura',
        icon: 'file:Infura.svg',
        group: ['transform'],
        version: 1,
        description: 'Infura API',
        defaults: {
            name: 'Infura',
            color: '#1A82e2',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'InfuraAPI',
                required: false,
            },
        ],
        properties: [
            // Node properties which the user gets displayed and
            // can change on the node.
            {
                displayName: 'ETH Network',
                name: 'ETHNetwork',
                type: 'options',
                options: [
                    {
                        name: 'Main Net',
                        value: 'mainnet',
                    },
                    {
                        name: 'Ropsten',
                        value: 'ropsten',
                    },
                    {
                        name: 'Rinkeby',
                        value: 'rinkeby',
                    },
                    {
                        name: 'Kovan',
                        value: 'kovan',
                    },
                    {
                        name: 'Görli',
                        value: 'goerli',
                    }
                ],
                default: 'mainnet',
                required: true,
                description: 'Network of Ethereum client provider.'
            },  
            {
                displayName: 'Infura Project ID',
                name: 'projectID',
                type: 'string',
                required: true,
                default: '',
                description: 'Infura Project ID.',
            },
            {
                displayName: 'JSON-RPC operation',
                name: 'operation',
                type: 'options',
                options: [
                    {
                        name: 'Get latest block number',
                        value: 'eth_blockNumber',
                    },
                    {
                        name: 'Get block by number',
                        value: 'eth_getBlockByNumber',
                    },
                    {
                        name: 'Call smart contract',
                        value: 'eth_call',
                    },
                    {
                        name: 'Send Raw Transaction',
                        value: 'eth_sendRawTransaction'
                    },
                    {
                        name: 'Get Transaction Count',
                        value: 'eth_getTransactionCount'
                    },
                ],
                default: 'eth_call',
                required: true,
                description: 'JSON-RPC operation to execute.'
            },      
            {
                displayName: 'Contract address',
                name: 'contractAddress',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_call',
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: '',
                description: 'Address of smart contract.',
            },
            {
                displayName: 'Wallet public address',
                name: 'walletAddress',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_call',
                            'eth_sendRawTransaction',
                        ],
                    },
                },                
                required: true,
                default: '',
                description: 'Public address of wallet.',                
            },
            {
                displayName: 'Access wallet by mnemonic phrase',
                name: 'accessWalletByMnemonic',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                default: false,
                description: 'If wallet is accessed by mnemonic phrase or private key.',
            },
            {
                displayName: 'Wallet private key',
                name: 'walletPrivateKey',
                type: 'string',
                displayOptions:{
                    show: {
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                        accessWalletByMnemonic: [
                            false,
                        ],
                    },
                },
                required: true,
                default: '',
                description: 'Private key associated to the wallet',
            },
            {
                displayName: 'Wallet mnemonic',
                name: 'walletMnemonic',
                type: 'string',
                displayOptions:{
                    show: {
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                        accessWalletByMnemonic: [
                            true,
                        ],
                    },
                },
                required: true,
                default: '',
                description: 'Mnemonic associated to the wallet',
            },
            {
                displayName: '⛽ Gas Limit',
                name: 'gasLimit',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    numberStepSize: 1,
                },
                displayOptions:{
                    show:{
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: 21000,
                description: 'Gas limit for transaction',
            },
            {
                displayName: '⛽ Gas Price (Gwei)',
                name: 'gasPrice',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    numberStepSize: 1,
                },                
                displayOptions:{
                    show:{
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: 45,
                description: 'Gas price for transaction',
            },            
            {
                displayName: 'Contract ABI',
                name: 'contractABI',
                type: 'json',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_call',
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: '',
                description: 'Contract ABI in JSON format.',                
            },
            {
                displayName: 'Contract Method',
                name: 'contractMethod',
                type: 'options',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_call',
                            'eth_sendRawTransaction',
                        ],
                    },
                },                
                typeOptions: {
                    loadOptionsDependsOn: ['contractABI'],
                    loadOptionsMethod: 'getContractMethods',
                },
                options: [],
                required: true,
                default: '',
                description: 'Method of contract.',
            },   
            {
                displayName: 'Inputs',
                name: 'contractInputs',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_call',
                            'eth_sendRawTransaction',
                        ],
                    },
                },                
                type: 'json',
                required: false,
                default: '',
                description: 'Inputs of contract method.'
            },
            {
                displayName: 'Block Number',
                name: 'blockNumber',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_getBlockByNumber',
                        ],
                    },
                },
                required: true,
                default: 100,
                type: 'number',
                description: 'Block number to get information.'
            }, 
            {
                displayName: 'Tag',
                name: 'transactionTag',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_getTransactionCount',
                        ],
                    },
                },
                required: true,
                default: 'pending',
                type: 'string',
                description: 'An integer block number, or the string "latest", "earliest" or "pending".',
            },            
            {
                displayName: 'Show transaction details?',
                name: 'showTransactionDetails',
                displayOptions: {
                    show: {
                        operation: [
                            'eth_getBlockByNumber',
                        ],
                    },
                },
                required: true,
                default: true,
                type: 'boolean',
                description: 'If true returns the full transaction objects.',
            }                                        
        ],
    };

    methods = {
        loadOptions: {
            async getContractMethods(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>{
                const returnData: INodePropertyOptions[] = [];
                                
                const json = validateJSON(this.getNodeParameter('contractABI', 0) as string);                
                if (json === undefined) {                    
                    throw new Error('Invalid JSON');
                }                
                
                json.forEach(function(element: any) {
                    if(element.type === "function"){
                        returnData.push({
                            name:  element.name,
                            value: element.name,
                        });
                    }
                });
                return returnData;
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length as unknown as number;        
        let responseData;
        
        const operation = this.getNodeParameter('operation', 0) as string;
        const ETHNetwork = this.getNodeParameter('ETHNetwork', 0) as string;
        const projectID = this.getNodeParameter('projectID', 0) as string;
        const url = `https://${ETHNetwork}.infura.io/v3/${projectID}`;
        const walletAddress = this.getNodeParameter('walletAddress', 0) as string;
        
        for (let i = 0; i < length; i++) {
            if (operation === 'eth_blockNumber'){
                const body = {
                    method: 'eth_blockNumber',
                    id: 1,
                    jsonrpc: '2.0',
                    params: [],
                };
                let response = await infuraApiRequest.call(this, body, url);
                const decodedData = parseInt(response.result, 16);

                responseData = { decodedData };         
            }
            if (operation === 'eth_getBlockByNumber'){
                const blockNumber = this.getNodeParameter('blockNumber', i) as number;
                const showTransactionDetails = this.getNodeParameter('showTransactionDetails', i) as boolean;
                const body = {
                    method: 'eth_getBlockByNumber',
                    id: 1,
                    jsonrpc: '2.0',
                    params: [blockNumber, showTransactionDetails],
                };
                let response = await infuraApiRequest.call(this, body, url);
                
                responseData = response;
            }
            if (operation === 'eth_call') {

                const contractAddress = this.getNodeParameter('contractAddress', 0) as string;
                const walletAddress = this.getNodeParameter('walletAddress', i) as string;
                const contractMethod = this.getNodeParameter('contractMethod', i) as string;
                const contractInputs = this.getNodeParameter('contractInputs', i) as any;

                const ABIjson = validateJSON(this.getNodeParameter('contractABI', 0) as string);        
                if (ABIjson === undefined) {                    
                    throw new Error('Invalid JSON');
                }                                

                const iface = new ethers.utils.Interface(ABIjson);
                const data = iface.encodeFunctionData(contractMethod, validateJSON(contractInputs));

                const body = {
                    method: 'eth_call',
                    id: 1,
                    jsonrpc: '2.0',
                    params: [
                        {
                            to: contractAddress,
                            from: walletAddress,
                            data: data /* 32 bytes block with the initial 4-byte being the signature */
                        },
                        'latest'
                    ]
                };
                let response = await infuraApiRequest.call(this, body, url);
                const decodedData = iface.decodeFunctionResult(contractMethod, response.result);

                responseData = { decodedData };
            }
            if (operation === 'eth_sendRawTransaction') {
                
                const contractAddress = this.getNodeParameter('contractAddress', 0) as string;
                const accessWalletByMnemonic = this.getNodeParameter('accessWalletByMnemonic', i) as boolean;
                
                let wallet;
                if(accessWalletByMnemonic){
                    const walletMnemonic = this.getNodeParameter('walletMnemonic', i) as string;
                    wallet = ethers.Wallet.fromMnemonic(walletMnemonic);
                }else{
                    const walletPrivateKey = this.getNodeParameter('walletPrivateKey', i) as string;
                    wallet = new ethers.Wallet(walletPrivateKey);
                }

                const contractMethod = this.getNodeParameter('contractMethod', i) as string;
                const contractInputs = this.getNodeParameter('contractInputs', i) as any;

                const ABIjson = validateJSON(this.getNodeParameter('contractABI', 0) as string);        
                if (ABIjson === undefined) {                    
                    throw new Error('Invalid JSON');
                }                                

                const iface = new ethers.utils.Interface(ABIjson);
                const data = iface.encodeFunctionData(contractMethod, validateJSON(contractInputs));

                const gasPrice = this.getNodeParameter('gasPrice', i) as number;
                const gasLimit = this.getNodeParameter('gasLimit', i) as number;

                /* TODO: Try to find a better way to manage the nonce. See https://ethereum.stackexchange.com/questions/39790/concurrency-patterns-for-account-nonce */
                const nonce = await getNonce.call(this, walletAddress, url);

                const tx = {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit,
                    data: data,
                    to: contractAddress,
                    nonce: nonce,
                }
                const signedTransaction = await wallet.signTransaction(tx);
                const body = {
                    method: 'eth_sendRawTransaction',
                    id: 1,
                    jsonrpc: '2.0',
                    params: [signedTransaction]
                };                
                let response = await infuraApiRequest.call(this, body, url);
                const decodedData = iface.decodeFunctionResult(contractMethod, response.result);

                responseData = { decodedData };                             
            }
            if(operation === 'eth_getTransactionCount') {           
                const walletAddress = this.getNodeParameter('walletAddress', i) as string;
                const transactionTag = this.getNodeParameter('transactionTag', i) as string;
                const body = {
                    method: 'eth_getTransactionCount',
                    id: 1,
                    jsonrpc: '2.0',
                    params: [walletAddress, transactionTag]
                };
                let response = await infuraApiRequest.call(this, body, url);
                const decodedData = parseInt(response.result, 16);

                responseData = { decodedData };                
            }            
            if (Array.isArray(responseData)) {
				returnData.push.apply(returnData, responseData as IDataObject[]);
			} else {
				returnData.push(responseData as IDataObject);
			}
        }
        // Map data to n8n data
        return [this.helpers.returnJsonArray(returnData)];
    }
}