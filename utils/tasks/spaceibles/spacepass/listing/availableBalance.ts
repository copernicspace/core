import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../../constants/contract.names'

const task = {
	name: 'spaceibles:spacepassport:listing:getAvaBal',
	desc: 'get assetAddress',
	contractName: contractNames.SPACEPASS_LISTING,

	params: {
		contract: 'contract',
		contractDesc: 'address of spacepass listing',
		user: 'user',
		userDesc: 'user address ',
		id: 'id',
		idDesc: 'tokenId of asset'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.contract, task.params.contractDesc)
	.addParam(task.params.user, task.params.userDesc)
	.addParam(task.params.id, task.params.idDesc)

	.setAction(
		async ({ contract, user, id }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, contract)
				.then(contract => contract.getAvailableBalance(user, id))
				.then(ab => console.log(ab))
	)
