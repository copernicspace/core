import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../tasks/utils/polygonScanLink'

const network = hre.network.name

async function main() {
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	// operator fee is integer, in  basis points, where 100% = 10000
	const operatorFee = 'operatorFee: SET ME ;)'

	await ethers
		.getContractFactory(contractNames.SPACEIBLE_OFFER)
		.then(factory => factory.deploy(operator, operatorFee))
		.then(contract => contract.deployed())
		.then(deployedContract => {
			console.log(`SpaceibleOffer contract deployed: ${deployedContract.address}`)
			console.log(polygonScanLink(deployedContract.deployTransaction.hash, network))
		})
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
