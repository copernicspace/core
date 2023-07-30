import hre, { ethers } from 'hardhat'

import ContractNames from '../../constants/contract.names'
import { polygonScanLink } from '../../polygonScanLink'

const network = hre.network.name

async function main() {
	await ethers
		.getContractFactory(ContractNames.PAYLOAD_ASSET)
		.then(deployFactory => deployFactory.deploy('app.copernicspace.com/assets'))
		.then(deployedContract => deployedContract.deployTransaction.wait())
		.then(txr => {
			console.log('`SpaceMart::PayloadAsset` contract deployed')
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
