import { task } from 'hardhat/config'

export const PAYLOAD_ASSET_TASK = {
	NAME: 'payloadAsset:deploy',
	DESC: 'deploys payload asset contract, which can be used as logic contract for clone factory',
	CONTRACT_NAME: 'PayloadAsset',

	URI: 'uri',
	URI_DESC: 'uri for ERC1155 constructor'
}

export default task(PAYLOAD_ASSET_TASK.NAME, PAYLOAD_ASSET_TASK.DESC)
	.addParam(PAYLOAD_ASSET_TASK.URI, PAYLOAD_ASSET_TASK.URI_DESC)
	.setAction(
		async ({ uri }, hre) =>
			await hre.ethers
				.getContractFactory(PAYLOAD_ASSET_TASK.CONTRACT_NAME)
				.then(factory => factory.deploy(uri))
				.then(contract => contract.deployed())
	)
