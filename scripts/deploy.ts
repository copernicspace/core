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
		.getContractFactory(ContractNames.CARGO_ASSET)
		.then(deployFactory => deployFactory.deploy('copernicspace.com'))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('CargoAsset deployed to:', assetAddress)

	const factoryAddress = await ethers
		.getContractFactory(ContractNames.CARGO_FACTORY)
		.then(deployFactory => deployFactory.deploy(assetAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.address)
	console.log('CargoFactory deployed to:', factoryAddress)

	const instantOfferAddress = await ethers
		.getContractFactory(ContractNames.INSTANT_OFFER)
		.then(deployFactory => deployFactory.deploy())
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
