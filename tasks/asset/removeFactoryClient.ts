import { task } from 'hardhat/config'

export const REVOKE_CLIENT_TASK = {
	NAME: 'cargoFactory:revokeClient',
	DESC: 'revoke address as factory client',
	CONTRACT_NAME: 'CargoFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of deployed cargo factory',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of client to remove from factory'
	}
}

export default task(REVOKE_CLIENT_TASK.NAME, REVOKE_CLIENT_TASK.DESC)
	.addParam(REVOKE_CLIENT_TASK.PARAMS.FACTORY_ADDRESS, REVOKE_CLIENT_TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(REVOKE_CLIENT_TASK.PARAMS.CLIENT_ADDRESS, REVOKE_CLIENT_TASK.PARAMS.CLIENT_ADDRESS_DESC)
	.setAction(
		async ({ client, factory }, hre) =>
			await hre.ethers
				.getContractAt(REVOKE_CLIENT_TASK.CONTRACT_NAME, factory)
				.then(contract => contract.revokeClient(client))
				.then(tx => console.log(tx.hash))
	)
