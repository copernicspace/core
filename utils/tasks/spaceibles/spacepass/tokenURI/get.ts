import { task } from 'hardhat/config'

import contractNames from '../../../../constants/contract.names'

const TASK = {
	NAME: 'spaceibles:spacepassport:tokenURI:get',
	DESC: 'get token metadata',
	CONTRACT_NAME: contractNames.SPACEPASS_ASSET,

	PARAMS: {
		ADDRESS: 'contract',
		ADDRESS_DESC: 'address of spacepass contract',
		TOKEN: 'token',
		TOKE_DESC: 'id of token'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.addParam(TASK.PARAMS.TOKEN, TASK.PARAMS.TOKE_DESC)
	.setAction(
		async ({ contract, token }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, contract)
				.then(contract => contract.uri(token))
				.then(result => console.log(result))
	)
