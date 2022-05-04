import { parseUnits } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'

async function main() {
	const kycAddress = await ethers
		.getContractFactory(ContractNames.KYC_REGISTER)
		.then(deployFactory => deployFactory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('KycRegister deployed to:', kycAddress)

	const assetAddress = await ethers
		.getContractFactory(ContractNames.PAYLOAD_ASSET)
		.then(deployFactory => deployFactory.deploy('app.copernicspace.com/assets'))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('PayloadAsset deployed to:', assetAddress)

	const factoryAddress = await ethers
		.getContractFactory(ContractNames.PAYLOAD_FACTORY)
		.then(deployFactory => deployFactory.deploy(assetAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('PayloadFactory deployed to:', factoryAddress)

	const [deployer] = await ethers.getSigners()

	const instantOfferAddress = await ethers
		.getContractFactory(ContractNames.INSTANT_OFFER)
		.then(deployFactory => deployFactory.deploy(deployer.address, parseUnits('3', 18)))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('InstantOffer deployed to:', instantOfferAddress)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
