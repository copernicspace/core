import { parseUnits } from 'ethers/lib/utils'
import hre, { ethers } from 'hardhat'

import contractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../tasks/utils/polygonScanLink'

const network = hre.network.name

async function main() {
	const [deployer] = await ethers.getSigners()

	await ethers
		.getContractFactory(contractNames.ESCROW_LISTING)
		.then(factory => factory.deploy(deployer.address, parseUnits('3', 18)))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract.deployTransaction.wait())
		.then(txr => {
			console.log('`SpaceMart::EscrowListing` contract deployed')
			console.log(`Address: ${txr.contractAddress}`)
			console.log(`Block: ${txr.blockNumber}`)
			console.log(`TX: ${polygonScanLink(txr.transactionHash, network)}`)
		})
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
