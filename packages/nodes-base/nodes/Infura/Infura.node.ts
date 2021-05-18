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
				displayName: 'ETH Network',
				name: 'ethNetwork',
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
					},
				],
				default: 'mainnet',
				required: true,
				description: 'Network of Ethereum client provider.',
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
				displayName: 'Operation',
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
						name: 'Estimate gas price',
						value: 'eth_estimateGas',
					},
					{
						name: 'Call smart contract',
						value: 'eth_call',
					},
					{
						name: 'Send raw transaction',
						value: 'eth_sendRawTransaction',
					},
					{
						name: 'Get transaction count',
						value: 'eth_getTransactionCount',
					},
				],
				default: 'eth_blockNumber',
				required: true,
				description: 'JSON-RPC operation to execute.',
			},
			{
				displayName: 'Contract address',
				name: 'contractAddress',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['eth_call', 'eth_sendRawTransaction'],
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
						operation: ['eth_getTransactionCount'],
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
						operation: ['eth_sendRawTransaction'],
					},
				},
				default: false,
				description: 'If wallet is accessed by mnemonic phrase or private key.',
			},
			{
				displayName: 'Wallet private key',
				name: 'walletPrivateKey',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['eth_sendRawTransaction'],
						accessWalletByMnemonic: [false],
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
				displayOptions: {
					show: {
						operation: ['eth_sendRawTransaction'],
						accessWalletByMnemonic: [true],
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
				displayOptions: {
					show: {
						operation: ['eth_sendRawTransaction'],
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
						operation: ['eth_sendRawTransaction'],
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
						operation: ['eth_call', 'eth_sendRawTransaction'],
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
						operation: ['eth_call', 'eth_sendRawTransaction'],
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
						operation: ['eth_call', 'eth_sendRawTransaction'],
					},
				},
				type: 'json',
				required: false,
				default: '',
				description: 'Inputs of contract method.',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Input',
				displayOptions: {
					show: {
						operation: ['eth_call', 'eth_sendRawTransaction'],
					},
				},
				options: [
					{
						name: 'customFieldsUi',
						displayName: 'Contract method inputs',
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
						operation: ['eth_getBlockByNumber'],
					},
				},
				required: true,
				default: 100,
				type: 'number',
				description: 'Block number to get information.',
			},
			{
				displayName: 'Tag',
				name: 'transactionTag',
				displayOptions: {
					show: {
						operation: ['eth_getTransactionCount'],
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
				json.forEach((element: any) => {
					if (element.type === 'function') {
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
		const projectID = this.getNodeParameter('projectID', 0) as string;

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
					projectId: projectID,
					projectSecret: credentials.projectSecret,
				});
			}
		} catch (error) {
			throw new NodeApiError(this.getNode(), error);
		}

		for (let i = 0; i < length; i++) {
			if (operation === 'eth_blockNumber') {
				const response = await provider.getBlockNumber();
				responseData = { blockNumber: response };
			}
			if (operation === 'eth_getBlockByNumber') {
				const blockNumber = this.getNodeParameter('blockNumber', i) as number;
				const response = await provider.getBlock(blockNumber);

				responseData = response;
			}
			if (operation === 'eth_call') {
				const contractAddress = this.getNodeParameter(
					'contractAddress',
					0,
				) as string;
				const contractMethod = this.getNodeParameter(
					'contractMethod',
					i,
				) as string;
				let contractInputs = validateJSON(
					this.getNodeParameter('contractInputs', i) as any,
				);
				if (!contractInputs) {
					contractInputs = [];
				}
				const abiJSON = validateJSON(
					this.getNodeParameter('contractABI', 0) as string,
				);
				if (abiJSON === undefined) {
					throw new Error('Invalid JSON');
				}

				const iface = new ethers.utils.Interface(abiJSON);
				const contract = new ethers.Contract(
					contractAddress,
					abiJSON,
					provider,
				);
				const response = await contract[contractMethod](...contractInputs);

				let decodedData: ethers.utils.Result | null;
				if (response.result) {
					decodedData = iface.decodeFunctionResult(
						contractMethod,
						response.result,
					);
				} else {
					decodedData = null;
				}

				responseData = { decodedData };
			}
			if (operation === 'eth_sendRawTransaction') {
				const contractAddress = this.getNodeParameter(
					'contractAddress',
					0,
				) as string;
				const contractMethod = this.getNodeParameter(
					'contractMethod',
					i,
				) as string;
				let contractInputs = validateJSON(
					this.getNodeParameter('contractInputs', i) as any,
				);
				if (!contractInputs) {
					contractInputs = [];
				}
				const accessWalletByMnemonic = this.getNodeParameter(
					'accessWalletByMnemonic',
					i,
				) as boolean;
				let wallet: ethers.Wallet;
				if (accessWalletByMnemonic) {
					const walletMnemonic = this.getNodeParameter(
						'walletMnemonic',
						i,
					) as string;
					wallet = ethers.Wallet.fromMnemonic(walletMnemonic);
				} else {
					const walletPrivateKey = this.getNodeParameter(
						'walletPrivateKey',
						i,
					) as string;
					wallet = new ethers.Wallet(walletPrivateKey);
				}
				wallet = wallet.connect(provider);

				const abiJSON = validateJSON(
					this.getNodeParameter('contractABI', 0) as string,
				);
				if (abiJSON === undefined) {
					throw new Error('Invalid JSON');
				}

				const iface = new ethers.utils.Interface(abiJSON);
				const gasPrice = this.getNodeParameter('gasPrice', i) as number;
				const gasLimit = this.getNodeParameter('gasLimit', i) as number;

				const contract = new ethers.Contract(contractAddress, abiJSON, wallet);
				const response = await contract[contractMethod](...contractInputs);
				// {
				// 		gasLimit,
				// 		gasPrice,
				// });
				responseData = { response };
			}
			if (operation === 'eth_getTransactionCount') {
				const walletAddress = this.getNodeParameter(
					'walletAddress',
					i,
				) as string;
				const transactionTag = this.getNodeParameter(
					'transactionTag',
					i,
				) as string;

				const response = await provider.getTransactionCount(
					walletAddress,
					transactionTag,
				);
				responseData = { transactionCount: response };
			}
			if (operation === 'eth_estimateGas') {
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
