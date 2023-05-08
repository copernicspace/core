import hre, { ethers } from 'hardhat'

import { logDeployDetails, logPreDeployDetails } from '../../../utils/logDetails'
import contractNames from '../../../constants/contract.names'

async function main() {
	const contractName = contractNames.SPACEPASS_LISTING
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()
	const operator = deployer.address

	// operator fee is integer, in  basis points, where 100% = 10000
	const operatorFee = '300'
	const assetAddress = 'set me'

	logPreDeployDetails({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address,
		operator: operator,
		operatorFee: operatorFee
	})

	const txr = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy(operator, operatorFee, assetAddress))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.deployTransaction.wait())

	logDeployDetails(txr, networkName)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
