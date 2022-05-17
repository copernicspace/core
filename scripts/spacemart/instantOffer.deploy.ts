import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'
import { parseUnits } from 'ethers/lib/utils'

const main = async () => {
	const [deployer] = await ethers.getSigners()
	await ethers.getContractFactory(ContractNames.INSTANT_OFFER).then(deployFactory =>
		deployFactory
			.deploy(deployer.address, parseUnits('3', 18))
			.then(contract => contract.deployed())
			.then(deployedContract => console.log(deployedContract.address))
	)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
