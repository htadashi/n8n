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
    ethCallRequest,
    ethSendRawTransaction,
    getABIfromEtherscan,
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
                name: 'infuraApi',
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
                        name: 'Call',
                        value: 'eth_call',
                    },
                    {
                        name: 'Send Raw Transaction',
                        value: 'eth_sendRawTransaction'
                    }
                ],
                default: 'eth_call',
                required: true,
                description: 'JSON-RPC operation to execute.'
            },      
            {
                displayName: 'Contract address',
                name: 'contractAddress',
                type: 'string',
                required: true,
                default: '',
                description: 'Address of smart contract.',
            },
            {
                displayName: 'Wallet address',
                name: 'walletAddress',
                type: 'string',
                required: true,
                default: '',
                description: 'Address of wallet.',                
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
                type: 'string',
                displayOptions:{
                    show:{
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: 500000,
                description: 'Gas limit for transaction',
            },
            {
                displayName: '⛽ Gas Price',
                name: 'gasPrice',
                type: 'string',
                displayOptions:{
                    show:{
                        operation: [
                            'eth_sendRawTransaction',
                        ],
                    },
                },
                required: true,
                default: 20000,
                description: 'Gas price for transaction',
            },            
            {
                displayName: 'Contract ABI',
                name: 'contractABI',
                type: 'json',
                required: true,
                default: '',
                description: 'Contract ABI in JSON format.',                
            },
            {
                displayName: 'Contract Method',
                name: 'contractMethod',
                type: 'options',
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
                type: 'json',
                required: false,
                default: '',
                description: 'Inputs of contract method.'
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
            async getContractMethodsUsingEtherscan(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>{
                const returnData: INodePropertyOptions[] = [];

                const contractAddress = this.getNodeParameter('contractAddress', 0) as string;

                let contractABI = await getABIfromEtherscan.call(this, contractAddress);
                contractABI.forEach(function(element: any) {
                    if(element.type === "function"){
                        returnData.push({
                            name:  element.name,
                            value: element.name,
                        });
                    }
                });
                return returnData;
            }
        }
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length as unknown as number;        
        let responseData;
        
        const operation = this.getNodeParameter('operation', 0) as string;
        const ETHNetwork = this.getNodeParameter('ETHNetwork', 0) as string;
        const projectID = this.getNodeParameter('projectID', 0) as string;
        const contractAddress = this.getNodeParameter('contractAddress', 0) as string;
        const walletAddress = this.getNodeParameter('walletAddress', 0) as string;
        
        for (let i = 0; i < length; i++) {
            if (operation === 'eth_call') {

                const contractMethod = this.getNodeParameter('contractMethod', i) as string;
                const contractInputs = this.getNodeParameter('contractInputs', i) as any;

                const ABIjson = validateJSON(this.getNodeParameter('contractABI', 0) as string);        
                if (ABIjson === undefined) {                    
                    throw new Error('Invalid JSON');
                }                                

                const iface = new ethers.utils.Interface(ABIjson);
                const data = iface.encodeFunctionData(contractMethod, validateJSON(contractInputs));

                let response = await ethCallRequest.call(this, ETHNetwork, projectID, contractAddress, walletAddress, data);
                const decodedData = iface.decodeFunctionResult(contractMethod, response.result);

                responseData = { decodedData };
            }
            if (operation === 'eth_sendRawTransaction') {

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

                const gasPrice = this.getNodeParameter('gasPrice', i) as string;
                const gasLimit = this.getNodeParameter('gasLimit', i) as any;

                const tx = {
                    gasPrice: 2000000000,
                    gasLimit: 185000,
                    data: data,
                    to: contractAddress,
                    nonce: 0,
                }
                const signedTransaction = await wallet.signTransaction(tx);
                let response = await ethSendRawTransaction.call(this, ETHNetwork, projectID, signedTransaction);                
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