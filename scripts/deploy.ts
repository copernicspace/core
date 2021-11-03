import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'
async function main() {
	const assetAddress = await ethers
		.getContractFactory(ContractNames.spaceAsset)
		.then(deployFactory => deployFactory.deploy('copernicspace.com'))
		.then(asset => asset.address)
	console.log('Asset deployed to:', assetAddress)

	const marketAddress = await ethers
		.getContractFactory('Market')
		.then(deployFactory => deployFactory.deploy(assetAddress))
		.then(market => market.address)
	console.log('Market deployed to:', marketAddress)

	const mockMoneyAddress = await ethers
		.getContractFactory('ERC20Mock')
		.then(deployFactory => deployFactory.deploy())
		.then(mockMoney => mockMoney.address)
	console.log('MockMoney deployed to:', mockMoneyAddress)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
