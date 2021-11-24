import { task } from 'hardhat/config'

export const CARGO_FACTORY_TASK = {
	NAME: 'cargoFactory:deploy',
	DESC: 'deploys cargo factory contract',
	CONTRACT_NAME: 'CargoFactory',

	PARAMS: {
		CARGO_ADDRESS: 'address',
		CARGO_ADDRESS_DESC: 'address of deployed cargo asset to use as logic template for clones'
	}
}

export default task(CARGO_FACTORY_TASK.NAME, CARGO_FACTORY_TASK.DESC)
	.addParam(CARGO_FACTORY_TASK.PARAMS.CARGO_ADDRESS, CARGO_FACTORY_TASK.PARAMS.CARGO_ADDRESS_DESC)
	.setAction(
		async ({ address }, hre) =>
			await hre.ethers
				.getContractFactory(CARGO_FACTORY_TASK.CONTRACT_NAME)
				.then(factory => factory.deploy(address))
				.then(contract => contract.deployed())
	)
