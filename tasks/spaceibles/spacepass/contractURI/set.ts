import { task } from 'hardhat/config'

import contractNames from '../../../../constants/contract.names'
import { polygonScanLink } from '../../../../utils/polygonScanLink'

const TASK = {
	NAME: 'spaceibles:spacepassport:contractURI:set',
	DESC: 'set contract metadata',
	CONTRACT_NAME: contractNames.SPACEPASS_ASSET,

	PARAMS: {
		ADDRESS: 'address',
		ADDRESS_DESC: 'address of spacepass contract',
		METADATA: 'metadata',
		METADATA_DESC: 'reference to new metadata'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.addParam(TASK.PARAMS.METADATA, TASK.PARAMS.METADATA)
	.setAction(
		async ({ address, metadata }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(contract => contract.setContractURI(metadata))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
