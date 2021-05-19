import {
		ICredentialType,
		NodePropertyTypes,
} from 'n8n-workflow';

export class Infura implements ICredentialType {    
		displayName = 'Infura API';
		name = 'InfuraAPI';
		documentationUrl = 'Infura';
		properties = [
				{
					displayName: 'Project ID',
					name: 'projectID',
					type: 'string' as NodePropertyTypes,
					default: '',
				},
				{
					displayName: 'Project Secret',
					name: 'projectSecret',
					type: 'string' as NodePropertyTypes,
					default: '',
				},				
		];
}