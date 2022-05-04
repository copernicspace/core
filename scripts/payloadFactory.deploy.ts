import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'

async function main() {
	const assetLogicTemplateAddress = 'SET ME ;)'

	await ethers
		.getContractFactory(ContractNames.PAYLOAD_FACTORY)
		.then(deployFactory => deployFactory.deploy(assetLogicTemplateAddress))
		.then(asset => console.log('Payload factory deployed to:', asset.address))
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
