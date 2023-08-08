import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../../constants/contract.names'
import { polygonScanLink } from '../../../../polygonScanLink'

const task = {
	name: 'spaceibles:spacepassport:tokenURI:set',
	desc: 'set contract metadata',
	contractName: contractNames.SPACEPASS_ASSET,
	params: {
		contract: 'contract',
		contract_desc: 'address of spacepass contract',
		token: 'token',
		token_desc: 'id of token',
		metadata: 'metadata',
		metadata_Desc: 'reference to new metadata'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contract_desc)
	.addParam(task.params.token, task.params.token_desc)
	.addParam(task.params.metadata, task.params.metadata)
	.setAction(
		async ({ contract, token, metadata }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.setURI(token, metadata))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
