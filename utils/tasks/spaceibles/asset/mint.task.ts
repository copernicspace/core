import { task } from 'hardhat/config'
import { polygonScanLink } from '../../../polygonScanLink'

const TASK = {
	NAME: 'spaceibles:mint',
	DESC: 'mints `SpaceibleAsset` token to transaction sender based on input params',
	CONTRACT_NAME: 'SpaceibleAsset',

	PARAMS: {
		ADDRESS: 'address',
		ADDRESS_DESC: 'address of deployed asset to sent `mint` functions',

		CID: 'cid',
		CID_DESC: 'content id - hash from IPFS for metadata',

		BALANCE: 'balance',
		BALANCE_DESC: 'amount how much to mint, 1 - is unique, N - multiple copies of',

		ROYALTIES: 'royalties',
		ROYALTIES_DESC: 'percentage share original creator gets from subsequent sales'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.addParam(TASK.PARAMS.CID, TASK.PARAMS.CID_DESC)
	.addParam(TASK.PARAMS.BALANCE, TASK.PARAMS.BALANCE_DESC)
	.addParam(TASK.PARAMS.ROYALTIES, TASK.PARAMS.ROYALTIES_DESC)
	.setAction(
		async ({ address, cid, balance, royalties }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(spaceibleAsset => spaceibleAsset.mint(cid, balance, royalties, '0x'))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
