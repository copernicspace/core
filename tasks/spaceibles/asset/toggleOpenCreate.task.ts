import { task } from 'hardhat/config'

import contractNames from '../../../constants/contract.names'
import { polygonScanLink } from '../../../utils/polygonScanLink'

const TASK = {
	NAME: 'spaceibles:toggleOpenCreate',
	DESC: 'toggle `openCreate` asset state',
	CONTRACT_NAME: contractNames.SPACEIBLE_ASSET,

	PARAMS: {
		SPACEIBLE_ASSET_ADDRESS: 'asset',
		SPACEIBLE_ASSET_ADDRESS_DESC: 'address of deployed spaceible asset'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.SPACEIBLE_ASSET_ADDRESS, TASK.PARAMS.SPACEIBLE_ASSET_ADDRESS_DESC)
	.setAction(
		async ({ asset }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, asset)
				.then(contract => contract.toggleOpenCreate())
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
