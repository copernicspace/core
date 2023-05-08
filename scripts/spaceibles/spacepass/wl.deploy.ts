import hre, { ethers } from 'hardhat'

import contractNames from '../../../constants/contract.names'
import { logDeployDetails, logPreDeployDetails } from '../../../utils/logDetails'

async function main() {
	const contractName = contractNames.KYC_REGISTER
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()

	logPreDeployDetails({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address
	})

	const txr = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy())
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
