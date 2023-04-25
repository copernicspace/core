import hre, { ethers } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { deployDetails } from '../../../utils/deployDetails'

async function main() {
	await ethers
		.getContractFactory(contractNames.SPACEPASS_ASSET)
		.then(factory => factory.deploy('ipfs://'))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.deployTransaction.wait())
		.then(txr => deployDetails(contractNames.SPACEPASS_ASSET, txr, hre.network.name))
}
main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
