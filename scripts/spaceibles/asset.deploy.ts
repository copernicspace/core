import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'

async function main() {
	const network = hre.network.name
	const scanSubdomain = network === 'polygon' ? '' : network.concat('.')
	await ethers
		.getContractFactory(contractNames.SPACEIBLE_ASSET)
		.then(factory => factory.deploy('ipfs://'))
		.then(contract => contract.deployed())
		.then(deployedContract =>
			console.log(
				`SpaceibleAsset contract deployed: https://${scanSubdomain}polygonscan.com/tx/${deployedContract.deployTransaction.hash}`
			)
		)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
