import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'

async function main() {
	const assetAddress = await ethers
		.getContractFactory(ContractNames.CARGO_ASSET)
		.then(deployFactory => deployFactory.deploy('copernicspace.com'))
		.then(asset => asset.address)
	console.log('Asset deployed to:', assetAddress)

	const factoryAddress = await ethers
		.getContractFactory(ContractNames.CARGO_FACTORY)
		.then(deployFactory => deployFactory.deploy())
		.then(asset => asset.address)
	console.log('Asset deployed to:', factoryAddress)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
