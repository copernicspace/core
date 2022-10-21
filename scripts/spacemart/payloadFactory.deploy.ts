import { polygonScanLink } from '../../tasks/utils/polygonScanLink'
import ContractNames from '../../constants/contract.names'
import hre, { ethers } from 'hardhat'

const network = hre.network.name

async function main() {
	const assetLogicTemplateAddress = 'set me;)'
	console.log(`Using ${assetLogicTemplateAddress} as payload asset logic template`)
	await ethers
		.getContractFactory(ContractNames.PAYLOAD_FACTORY)
		.then(deployFactory => deployFactory.deploy(assetLogicTemplateAddress))
		.then(deployedContract => deployedContract.deployTransaction.wait())
		.then(txr => {
			console.log('`SpaceMart::PayloadFactory` contract deployed')
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
