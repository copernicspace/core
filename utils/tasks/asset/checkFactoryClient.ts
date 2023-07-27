import { task } from 'hardhat/config'

export const CHECK_CLIENT_TASK = {
	NAME: 'payloadFactory:checkClient',
	DESC: 'call contract to verify address is factory client',
	CONTRACT_NAME: 'PayloadFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of deployed payload factory',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of new client to add to the factory'
	}
}

export default task(CHECK_CLIENT_TASK.NAME, CHECK_CLIENT_TASK.DESC)
	.addParam(CHECK_CLIENT_TASK.PARAMS.FACTORY_ADDRESS, CHECK_CLIENT_TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(CHECK_CLIENT_TASK.PARAMS.CLIENT_ADDRESS, CHECK_CLIENT_TASK.PARAMS.CLIENT_ADDRESS_DESC)
	.setAction(
		async ({ client, factory }, hre) =>
			await hre.ethers
				.getContractAt(CHECK_CLIENT_TASK.CONTRACT_NAME, factory)
				.then(contract => checkFactoryClient(contract, client))
				.then(result => console.log(`Address ${client} client status: ${result}`))
	)

const checkFactoryClient = async (contract, address): Promise<boolean> => {
	const role = await contract.FACTORY_CLIENT()
	return contract.hasRole(role, address)
}
