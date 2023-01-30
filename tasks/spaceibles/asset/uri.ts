import { task } from 'hardhat/config'

import contractNames from '../../../constants/contract.names'

const TASK = {
	NAME: 'spaceibles:uri',
	DESC: 'call `uri()`',
	CONTRACT_NAME: contractNames.SPACEIBLE_ASSET,

	PARAMS: {
		SPACEIBLE_ASSET_ADDRESS: 'address',
		SPACEIBLE_ASSET_ADDRESS_DESC: 'address of deployed spaceible asset'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.SPACEIBLE_ASSET_ADDRESS, TASK.PARAMS.SPACEIBLE_ASSET_ADDRESS_DESC)
	.setAction(
		async ({ address }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(contract => contract.uri())
				.then(uri => console.log(uri))
	)
