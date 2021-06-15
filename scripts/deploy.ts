import { ethers } from 'hardhat'

async function main() {
	const assetContractName = 'Asset'
	const assetAddress = await ethers.getContractFactory(assetContractName)
		.then(deployFactory => deployFactory.deploy('copernicspace.com'))
		.then(asset => asset.address)
	console.log('Asset deployed to:', assetAddress)

	const marketAddress = await ethers.getContractFactory('Market')
		.then(deployFactory => deployFactory.deploy(assetAddress))
		.then(market => market.address)
	console.log('Market deployed to:', marketAddress)

	const mockMoneyAddress = await ethers.getContractFactory('ERC20Mock')
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
