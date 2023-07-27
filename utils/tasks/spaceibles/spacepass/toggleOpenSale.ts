import { task as hhTask } from 'hardhat/config'

import contractNames from '../../../constants/contract.names'
import { polygonScanLink } from '../../../../utils/polygonScanLink'

const task = {
	name: 'spaceibles:spacepass:toggleOpenSale',
	desc: 'toggle `openCreate` asset state',
	contractName: contractNames.SPACEPASS_ASSET,
	params: {
		contract: 'contract',
		contractDesc: 'address of spacepass contract'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contractDesc)
	.setAction(
		async ({ contract }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.toggleOpenSale())
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
