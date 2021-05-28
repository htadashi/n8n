import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError
} from 'n8n-workflow';

import { validateJSON } from './GenericFunctions';

import { ethers } from 'ethers';

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
				displayName: 'Ethereum Network',
				name: 'ethNetwork',
				type: 'options',
				options: [
					{
						name: 'Main net',
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
					},
				],
				default: 'mainnet',
				required: true,
				description: 'Network of Ethereum client provider.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Get latest block number',
						value: 'operationGetBlockNumber',
					},
					{
						name: 'Get block by number',
						value: 'operationGetBlockByNumber',
					},
					{
						name: 'Estimate gas price',
						value: 'operationEstimateGas',
					},
					{
						name: 'Call smart contract function',
						value: 'operationCallContract',
					},
					{
						name: 'Send transaction',
						value: 'operationSendTransaction',
					},
					{
						name: 'Get transaction count',
						value: 'operationGetTransactionCount',
					},
				],
				default: 'operationGetBlockNumber',
				required: true,
				description: 'Operation to execute.',
			},
			{
				displayName: 'Recipient Address',
				name: 'recipientAddress',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
					},
				},
				required: true,
				default: '',
				description: 'Address of smart contract or recipient wallet.',
			},
			{
				displayName: 'Wallet Public Address',
				name: 'walletAddress',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['operationGetTransactionCount'],
					},
				},
				required: true,
				default: '',
				description: 'Public address of wallet.',
			},			
			{
				displayName: 'Contract ABI',
				name: 'contractABI',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['operationCallContract'],
					},
				},
				required: true,
				default: '',
				description: 'Contract ABI in JSON format.',
			},
			{
				displayName: 'Function Type',
				name: 'stateMutability',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['operationCallContract'],
					},
				},
				options: [
					{
						name: 'Pure/View',
						value: 'pureOrView',
					},
					{
						name: 'Non-payable',
						value: 'nonpayable',
					},
					{
						name: 'Payable',
						value: 'payable',
					},
				],
				default: 'Pure/View',
				description: 'State mutability of function',
			},
			{
				displayName: 'Mnemonic Access',
				name: 'accessWalletByMnemonic',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
					},
					hide: {
						stateMutability: ['pureOrView'],
					},
				},
				default: false,
				description: 'If wallet is accessed by mnemonic phrase or private key.',
			},
			{
				displayName: 'Wallet Private Key',
				name: 'walletPrivateKey',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
						accessWalletByMnemonic: [false],
					},
					hide: {
						stateMutability: ['pureOrView'],
					},					
				},
				required: true,
				default: '',
				description: 'Private key associated to the wallet',
			},
			{
				displayName: 'Wallet Mnemonic',
				name: 'walletMnemonic',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
						accessWalletByMnemonic: [true],
					},
					hide: {
						stateMutability: ['pureOrView'],
					},							
				},
				required: true,
				default: '',
				description: 'Mnemonic associated to the wallet',
			},
			{
				displayName: '👨🏻‍🔧 Setup Gas',
				name: 'configureGasManually',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
					},
					hide: {
						stateMutability: ['pureOrView'],
					},							
				},
				default: false,
				description: 'If true, the user can set up the value for gas limit and price. Otherwise, use default values for gas limit and price.',
			},						
			{
				displayName: '⛽ Gas Limit',
				name: 'gasLimit',
				type: 'number',
				typeOptions: {
					minValue: 0,
					numberStepSize: 1,
				},
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
						configureGasManually: [true],
					},
					hide: {
						stateMutability: ['pureOrView'],
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
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
						configureGasManually: [true],
					},
					hide: {
						stateMutability: ['pureOrView'],
					},							
				},
				required: true,
				default: 45,
				description: 'Gas price for transaction',
			},
			{
				displayName: 'Ξ Value (ETH)',
				name: 'payValue',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						operation: ['operationCallContract','operationSendTransaction'],
					},
					hide: {
						stateMutability: ['pureOrView', 'nonpayable'],
					},							
				},
				required: true,
				default: 0,
				description: 'Value to send for transaction',
			},						
			{
				displayName: 'Contract Function',
				name: 'contractMethod',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['operationCallContract'],
					},
				},
				typeOptions: {
					loadOptionsDependsOn: ['contractABI','stateMutability'],
					loadOptionsMethod: 'getContractMethods',
				},
				required: true,
				default: '',
				description: 'Smart contract function to called.',
			},
			{
				displayName: 'Inputs',
				name: 'contractInputs',
				displayOptions: {
					show: {
						operation: ['operationCallContract'],
					},
				},
				type: 'json',
				required: false,
				default: '',
				description: 'Inputs for the selected smart contract function.',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Contract Input',
				displayOptions: {
					show: {
						operation: ['operationCallContract'],
					},
				},
				options: [
					{
						name: 'customFieldsUi',
						displayName: 'Smart Contract Function Inputs',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								typeOptions: {
									loadOptionsDependsOn: ['contractMethod'],
									loadOptionsMethod: 'getContractInputs',
								},
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Block Number',
				name: 'blockNumber',
				displayOptions: {
					show: {
						operation: ['operationGetBlockByNumber'],
					},
				},
				required: true,
				default: 0,
				type: 'number',
				description: 'Block number to get information.',
			},
			{
				displayName: 'Tag',
				name: 'transactionTag',
				displayOptions: {
					show: {
						operation: ['operationGetTransactionCount'],
					},
				},
				required: true,
				default: 'pending',
				type: 'string',
				description:
					'An integer block number, or the string "latest", "earliest" or "pending".',
			},
		],
	};

	methods = {
		loadOptions: {
			async getContractMethods(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const json = validateJSON(
					this.getNodeParameter('contractABI', 0) as string,
				);
				if (json === undefined) {
					throw new Error('Invalid JSON');
				}
				const stateMutability = this.getNodeParameter('stateMutability', 0) as string;				
				json.forEach((element: any) => {
					if (element.type === 'function' &&
					(element.stateMutability === stateMutability || (stateMutability === 'pureOrView' && (element.stateMutability === 'pure' || element.stateMutability === 'view')))) {
						returnData.push({
							name: element.name,
							value: element.name,
						});
					}
				});
				return returnData;
			},
			async getContractInputs(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const json = validateJSON(
					this.getNodeParameter('contractABI', 0) as string,
				);
				if (json === undefined) {
					throw new Error('Invalid JSON');
				}
				const method = this.getNodeParameter('contractMethod', 0) as string;
				json.forEach((element: any) => {
					if (element.type === 'function' && element.name === method) {
						element.inputs.forEach((input: any) => {
							returnData.push({
								name: input.name,
								value: input.name,
							});
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
		const length = (items.length as unknown) as number;
		let responseData;

		const operation = this.getNodeParameter('operation', 0) as string;
		const ethNetwork = this.getNodeParameter('ethNetwork', 0) as string;

		let provider: ethers.providers.InfuraProvider;
		try {
			const credentials = this.getCredentials('InfuraAPI');
			if (credentials === undefined) {
				throw new NodeOperationError(
					this.getNode(),
					'No credentials got returned!',
				);
			} else {
				provider = new ethers.providers.InfuraProvider(ethNetwork, {
					projectId: credentials.projectID,
					projectSecret: credentials.projectSecret,
				});
			}
		} catch (error) {
			throw new NodeApiError(this.getNode(), error);
		}

		for (let i = 0; i < length; i++) {
			if (operation === 'operationGetBlockNumber') {
				const response = await provider.getBlockNumber();
				responseData = { blockNumber: response };
			}
			if (operation === 'operationGetBlockByNumber') {
				const blockNumber = this.getNodeParameter('blockNumber', i) as number;
				const response = await provider.getBlock(blockNumber);

				responseData = response;
			}
			if (operation === 'operationSendTransaction') {
				const recipientAddress = this.getNodeParameter('recipientAddress', i) as string;
				const payValue = this.getNodeParameter('payValue', i) as number;
				const accessWalletByMnemonic = this.getNodeParameter('accessWalletByMnemonic', i) as boolean;
				let wallet: ethers.Wallet;
				if (accessWalletByMnemonic) {
					const walletMnemonic = this.getNodeParameter('walletMnemonic', i) as string;
					wallet = ethers.Wallet.fromMnemonic(walletMnemonic);
				} else {
					const walletPrivateKey = this.getNodeParameter('walletPrivateKey', i) as string;
					wallet = new ethers.Wallet(walletPrivateKey);
				}
				wallet = wallet.connect(provider);

				const tx = {
					to: recipientAddress,
					value: ethers.utils.parseEther(payValue.toString()),
				};
				const transaction = await wallet.sendTransaction(tx);
				const transactionReceipt = await provider.waitForTransaction(transaction.hash);				  

				responseData = transactionReceipt;
			}
			if (operation === 'operationCallContract') {
				const recipientAddress = this.getNodeParameter('recipientAddress', i) as string;							
				const contractMethod = this.getNodeParameter('contractMethod', i) as string;
				
				let contractInputs = validateJSON(
					this.getNodeParameter('contractInputs', i) as any,
				);				
				if (!contractInputs) {
					contractInputs = [];
				}
				
				const accessWalletByMnemonic = this.getNodeParameter('accessWalletByMnemonic', i) as boolean;
				let wallet: ethers.Wallet;
				if (accessWalletByMnemonic) {
					const walletMnemonic = this.getNodeParameter('walletMnemonic', i) as string;
					wallet = ethers.Wallet.fromMnemonic(walletMnemonic);
				} else {
					const walletPrivateKey = this.getNodeParameter('walletPrivateKey', i) as string;
					wallet = new ethers.Wallet(walletPrivateKey);
				}
				wallet = wallet.connect(provider);

				const abiJSON = validateJSON(this.getNodeParameter('contractABI', i) as string);
				if (abiJSON === undefined) {
					throw new Error('Invalid JSON');
				}

				const configureGasManually = this.getNodeParameter('configureGasManually', i) as boolean;
				const overrides : ethers.PayableOverrides  = {};
				if(configureGasManually){
					const gasPrice = this.getNodeParameter('gasPrice', i) as number;
					const gasLimit = this.getNodeParameter('gasLimit', i) as number;					
					overrides.gasPrice = ethers.BigNumber.from(gasPrice);
					overrides.gasLimit = ethers.BigNumber.from(gasLimit);
				}
				const stateMutability = this.getNodeParameter('stateMutability', 0) as string;
				if(stateMutability === 'payable'){
					const payValue = this.getNodeParameter('payValue', i) as string;
					overrides.value = ethers.utils.parseEther(payValue);
				}

				const contract = new ethers.Contract(recipientAddress, abiJSON, wallet);
				const response = await contract[contractMethod](...contractInputs, overrides);
				responseData = { response };
			}
			if (operation === 'operationGetTransactionCount') {
				const walletAddress = this.getNodeParameter('walletAddress', i) as string;
				const transactionTag = this.getNodeParameter('transactionTag', i) as string;

				const response = await provider.getTransactionCount(
					walletAddress,
					transactionTag,
				);
				responseData = { transactionCount: response };
			}
			if (operation === 'operationEstimateGas') {
				const gasPrice = await provider.getGasPrice();
				responseData = { gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') };
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
