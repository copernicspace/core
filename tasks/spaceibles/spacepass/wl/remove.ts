import { task as hhTask } from 'hardhat/config'

import contractNames from '../../../../constants/contract.names'
import { polygonScanLink } from '../../../../utils/polygonScanLink'

const task = {
	name: 'spaceibles:spacepassport:wl:remove',
	desc: 'remove user address to wl contract',
	contractName: contractNames.KYC_REGISTER,
	params: {
		contract: 'contract',
		contractDesc: 'address of spacepass contract',
		address: 'address',
		addressDesc: 'user address to remove from wl'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contractDesc)
	.addParam(task.params.address, task.params.addressDesc)
	.setAction(
		async ({ contract, address }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.setKycStatus(address, false))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
