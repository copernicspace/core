import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../../constants/contract.names'
import { polygonScanLink } from '../../../../polygonScanLink'

const task = {
	name: 'spaceibles:spacepassport:contractURI:set',
	desc: 'set contract metadata',
	contractName: contractNames.SPACEPASS_ASSET,
	params: {
		contract: 'contract',
		contract_desc: 'address of spacepass contract',
		metadata: 'metadata',
		metadata_Desc: 'reference to new metadata'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contract_desc)
	.addParam(task.params.metadata, task.params.metadata)
	.setAction(
		async ({ contract, metadata }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.setContractURI(metadata))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
