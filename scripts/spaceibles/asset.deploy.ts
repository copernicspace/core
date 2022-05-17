import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../tasks/utils/polygonScanLink'

const network = hre.network.name

async function main() {
	await ethers
		.getContractFactory(contractNames.SPACEIBLE_ASSET)
		.then(factory => factory.deploy('ipfs://'))
		.then(contract => contract.deployed())
		.then(deployedContract => {
			console.log(`SpaceibleAsset contract deployed: ${deployedContract.address}`)
			console.log(polygonScanLink(deployedContract.deployTransaction.hash, network))
		})
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
