// scripts/predict-contract-address.ts

import { ethers } from 'hardhat'

async function main() {
	const [deployer] = await ethers.getSigners()
	const deployerAddress = await deployer.getAddress()
	const nonce = await ethers.provider.getTransactionCount(deployerAddress)

	const predictedAddress = ethers.utils.getContractAddress({
		from: deployerAddress,
		nonce: nonce
	})

	console.log('Predicted contract address:', predictedAddress)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
