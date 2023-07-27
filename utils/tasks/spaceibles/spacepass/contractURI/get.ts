import { task } from 'hardhat/config'

import contractNames from '../../../../constants/contract.names'

const TASK = {
	NAME: 'spaceibles:spacepassport:contractURI:get',
	DESC: 'get contract metadata',
	CONTRACT_NAME: contractNames.SPACEPASS_ASSET,

	PARAMS: {
		ADDRESS: 'address',
		ADDRESS_DESC: 'address of spacepass contract'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.setAction(
		async ({ address }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(contract => contract.contractURI())
				.then(result => console.log(result))
	)
