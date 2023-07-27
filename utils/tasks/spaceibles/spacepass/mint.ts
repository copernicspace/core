import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../constants/contract.names'
import { polygonScanLink } from '../../../polygonScanLink'

const task = {
	name: 'spaceibles:spacepassport:mint',
	desc: 'mint new asset',
	contractName: contractNames.SPACEPASS_ASSET,

	params: {
		contract: 'contract',
		contractDesc: 'address of spacepass contract',
		metadata: 'metadata',
		metadataDesc: 'reference to new metadata',
		balance: 'balance',
		balanceDesc: 'amount of token to be minted',
		royalties: 'royalties',
		royaltiesDesc: 'value for royalties to be sent '
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contractDesc)
	.addParam(task.params.metadata, task.params.metadata)
	.addParam(task.params.balance, task.params.balanceDesc)
	.addParam(task.params.royalties, task.params.royaltiesDesc)
	.setAction(
		async ({ contract, metadata, balance, royalties }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.mint(metadata, balance, royalties, '0x'))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
