import { task } from 'hardhat/config'

export const REVOKE_CLIENT_TASK = {
	NAME: 'payloadFactory:revokeClient',
	DESC: 'revoke client role from address at factory client',
	CONTRACT_NAME: 'PayloadFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of deployed payload factory',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of client to revole clioent role from factory'
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
