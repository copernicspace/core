import { ethers } from 'hardhat'
import { parseUnits } from 'ethers/lib/utils'

import ContractNames from '../../constants/contract.names'

const main = async () => {
	const [deployer] = await ethers.getSigners()
	// 3 - for 3%
	const operatorFee = 'set me'
	// digital payload is 6!:)
	const decimals = 'set me'
	await ethers.getContractFactory(ContractNames.INSTANT_OFFER).then(deployFactory =>
		deployFactory
			.deploy(deployer.address, parseUnits(operatorFee, decimals))
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
