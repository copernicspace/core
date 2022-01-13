import { task } from 'hardhat/config'

export const ADD_CLIENT_TASK = {
	NAME: 'cargoFactory:addClient',
	DESC: 'add address to factory client',
	CONTRACT_NAME: 'CargoFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of deployed cargo factory',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of new client to add to the factory'
	}
}

export default task(ADD_CLIENT_TASK.NAME, ADD_CLIENT_TASK.DESC)
	.addParam(ADD_CLIENT_TASK.PARAMS.FACTORY_ADDRESS, ADD_CLIENT_TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(ADD_CLIENT_TASK.PARAMS.CLIENT_ADDRESS, ADD_CLIENT_TASK.PARAMS.CLIENT_ADDRESS_DESC)
	.setAction(
		async ({ client, factory }, hre) =>
			await hre.ethers
				.getContractAt(ADD_CLIENT_TASK.CONTRACT_NAME, factory)
				.then(contract => contract.addClient(client))
				.then(tx => console.log(tx.hash))
	)
