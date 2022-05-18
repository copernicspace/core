import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'

async function main() {
	const assetAddress = await ethers
		.getContractFactory(ContractNames.PAYLOAD_ASSET)
		.then(deployFactory => deployFactory.deploy('app.copernicspace.com/assets'))
		.then(asset => asset.address)
	console.log('SpacePayload asset deployed to:', assetAddress)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
