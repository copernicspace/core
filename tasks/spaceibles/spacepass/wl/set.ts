import { task as hhTask } from 'hardhat/config'

import contractNames from '../../../../constants/contract.names'
import { polygonScanLink } from '../../../../utils/polygonScanLink'

const task = {
	name: 'spaceibles:spacepassport:wl:set',
	desc: 'set user status to wl contract',
	contractName: contractNames.KYC_REGISTER,
	params: {
		contract: 'contract',
		contractDesc: 'address of spacepass contract',
		address: 'address',
		addressDesc: 'user address to add  to wl',
		add: 'add',
		add_desc: 'if this flag exists - user will be added to WL, otherwise removed'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contractDesc)
	.addParam(task.params.address, task.params.addressDesc)
	.addFlag(task.params.add, task.params.add_desc)
	.setAction(
		async ({ contract, address, add }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(wl => wl.setKycStatus(address, add))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
