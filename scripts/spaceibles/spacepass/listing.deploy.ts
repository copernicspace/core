import hre, { ethers } from 'hardhat'
import contractNames from '../../../constants/contract.names'
import { deployDetails } from '../../../utils/deployDetails'

async function main() {
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	// operator fee is integer, in  basis points, where 100% = 10000
	const operatorFee = 'SET ME'
	const assetAddress = 'SET ME'

	await ethers
		.getContractFactory(contractNames.SPACEIBLE_OFFER)
		.then(factory => factory.deploy(operator, operatorFee, assetAddress))
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
