import { task } from 'hardhat/config'

export const PAYLOAD_FACTORY_TASK = {
	NAME: 'payloadFactory:deploy',
	DESC: 'deploys payload factory contract',
	CONTRACT_NAME: 'PayloadFactory',

	PARAMS: {
		PAYLOAD_ADDRESS: 'address',
		PAYLOAD_ADDRESS_DESC: 'address of deployed payload asset to use as logic template for clones'
	}
}

export default task(PAYLOAD_FACTORY_TASK.NAME, PAYLOAD_FACTORY_TASK.DESC)
	.addParam(PAYLOAD_FACTORY_TASK.PARAMS.PAYLOAD_ADDRESS, PAYLOAD_FACTORY_TASK.PARAMS.PAYLOAD_ADDRESS_DESC)
	.setAction(
		async ({ address }, hre) =>
			await hre.ethers
				.getContractFactory(PAYLOAD_FACTORY_TASK.CONTRACT_NAME)
				.then(factory => factory.deploy(address))
				.then(contract => contract.deployed())
	)
