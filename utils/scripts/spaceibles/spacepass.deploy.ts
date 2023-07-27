import hre, { ethers } from 'hardhat'
import contractNames from '../../constants/contract.names'
import { logStart, logDeploy } from '../../logDetails'

const deployKycRegister = async () => {
	const contractName = contractNames.KYC_REGISTER
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
	return contract.address
}

const deploySpacepassAsset = async (kycAddress: string) => {
	const contractName = contractNames.SPACEPASS_ASSET
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address,
		wl: kycAddress
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy('ipfs://', kycAddress))
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
	return contract.address
}

const deploySpacepassListing = async (assetAddress: string) => {
	const contractName = contractNames.SPACEPASS_LISTING
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address
	const operatorFee = '300'

	logStart({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address,
		operator: operator,
		operatorFee: operatorFee
	})

	const contract = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy(operator, operatorFee, assetAddress))
		.then(contract => contract.deployed())

	const txr = await contract.deployTransaction.wait()
	logDeploy(txr, networkName)
}

async function main() {
	try {
		const kycAddress = await deployKycRegister()
		const assetAddress = await deploySpacepassAsset(kycAddress)
		await deploySpacepassListing(assetAddress)
		process.exit(0)
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
}

main()
