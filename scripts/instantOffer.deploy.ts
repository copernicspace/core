import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'

const main = async () =>
	await ethers
		.getContractFactory(ContractNames.INSTANT_OFFER)
		.then(deployFactory => deployFactory.deploy())
		.then(asset => console.log(asset.address))

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
