import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../tasks/utils/polygonScanLink'

const network = hre.network.name

async function main() {
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	// operator fee is integer, in  basis points, where 100% = 10000
	const operatorFee = 300
	const assetAddress = '0x9C27091eA94D930dec660bE0642bf809bda158a8'

	await ethers
		.getContractFactory(contractNames.SPACEIBLE_OFFER)
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
