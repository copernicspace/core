import { task } from 'hardhat/config'
import contractNames from '../../../constants/contract.names'
import { polygonScanLink } from '../../../utils/polygonScanLink'

const TASK = {
	NAME: 'spaceibles:spacepassport:mint',
	DESC: 'mint new asset',
	CONTRACT_NAME: contractNames.SPACEPASS_ASSET,

	PARAMS: {
		ADDRESS: 'address',
		ADDRESS_DESC: 'address of spacepass contract',
		METADATA: 'metadata',
		METADATA_DESC: 'reference to new metadata',
		BALANCE: 'balance',
		BALANCE_DESC: 'amount of token to be minted',
		ROYALTIES: 'royalties',
		ROYALTIES_DESC: 'value for royalties to be sent '
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.addParam(TASK.PARAMS.METADATA, TASK.PARAMS.METADATA)
	.addParam(TASK.PARAMS.BALANCE, TASK.PARAMS.BALANCE_DESC)
	.addParam(TASK.PARAMS.ROYALTIES, TASK.PARAMS.ROYALTIES_DESC)
	.setAction(
		async ({ address, metadata, balance, royalties }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(contract => contract.mint(metadata, balance, royalties, '0x'))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
