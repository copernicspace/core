import hre, { ethers } from 'hardhat'

import contractNames from '../../../constants/contract.names'
import { logDeployDetails, logPreDeployDetails } from '../../../utils/logDetails'

async function main() {
	const contractName = contractNames.SPACEPASS_ASSET
	const networkName = hre.network.name
	const [deployer] = await ethers.getSigners()

	const kycAddress = '0x390A621dF4dac678ad10BA5D00c41867a320bF6E' // from scripts/spaceibles/spacepass/wl.deploy.ts

	logPreDeployDetails({
		contractName: contractName,
		network: networkName,
		deployer: deployer.address
	})

	const txr = await ethers
		.getContractFactory(contractName)
		.then(factory => factory.deploy('ipfs://', kycAddress))
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
