import { task as hhTask } from 'hardhat/config'
import contractNames from '../../../../constants/contract.names'

const task = {
	name: 'spaceibles:spacepassport:listing:get',
	desc: 'get listing info',
	contractName: contractNames.SPACEPASS_LISTING,

	params: {
		address: 'address',
		contractDesc: 'address of spacepass listing',
		listing: 'listing',
		listingDesc: 'id of listing'
	}
}

export default hhTask(task.name, task.desc)
	.addParam(task.params.address, task.params.contractDesc)
	.addParam(task.params.listing, task.params.listingDesc)
	.setAction(
		async ({ address, listing }, hre) =>
			await hre.ethers
				.getContractAt(task.contractName, address)
				.then(contract => contract.get(listing).then(address => console.log(address)))
	)
