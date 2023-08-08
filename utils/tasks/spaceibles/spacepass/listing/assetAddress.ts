import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../../constants/contract.names'

const task = {
	name: 'spaceibles:spacepassport:listing:getAssetAddress',
	desc: 'get assetAddress',
	contractName: contractNames.SPACEPASS_LISTING,

	params: {
		address: 'address',
		contractDesc: 'address of spacepass listing'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.address, task.params.contractDesc)
	.setAction(
		async ({ address }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, address)
				.then(contract => contract.assetAddress())
				.then(address => console.log(address))
	)
