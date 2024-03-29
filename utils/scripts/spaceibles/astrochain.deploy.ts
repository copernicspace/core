import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../polygonScanLink'

const network = hre.network.name

async function main() {
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	// operator fee is integer, in  basis points, where 100% = 10000, 3% = 300
	const operatorFee = 'SET ME'
	const assetAddress = 'SET ME'

	await ethers
		.getContractFactory(contractNames.ASTROCHAIN_LISTING)
		.then(factory => factory.deploy(operator, operatorFee, assetAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => {
			console.log('`SpaceibleOffer` contract deployed')
			console.log(`Address: ${deployedContract.address}`)
			return deployedContract.deployTransaction.wait()
		})
		.then(txr => {
			console.log(`Block: ${txr.blockNumber}`)
			console.log(`TX: ${polygonScanLink(txr.transactionHash, network)}`)
		})
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
