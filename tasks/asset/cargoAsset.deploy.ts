import { task } from 'hardhat/config'

export const CARGO_ASSET_TASK = {
	NAME: 'cargoAsset:deploy',
	DESC: 'deploys cargo asset contract, which can be used as logic contract for clone factory',
	CONTRACT_NAME: 'CargoAsset',

	URI: 'uri',
	URI_DESC: 'uri for ERC1155 constructor'
}

export default task(CARGO_ASSET_TASK.NAME, CARGO_ASSET_TASK.DESC)
	.addParam(CARGO_ASSET_TASK.URI, CARGO_ASSET_TASK.URI_DESC)
	.setAction(
		async ({ uri }, hre) =>
			await hre.ethers
				.getContractFactory(CARGO_ASSET_TASK.CONTRACT_NAME)
				.then(factory => factory.deploy(uri))
				.then(contract => contract.deployed())
	)
