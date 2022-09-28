import { ethers } from 'hardhat'
import ContractNames from '../constants/contract.names'
import { polygonScanLink } from '../tasks/utils/polygonScanLink'

const network = 'mumbai' // polygon / mumbai
const name = 'DAI Stablecoin'
const symbol = 'DAI'
const decimals = '18'

const main = async () =>
	await ethers
		.getContractFactory(ContractNames.ERC20_MOCK)
		.then(deployFactory => deployFactory.deploy(name, symbol, decimals))
		.then(deployedContract => {
			console.log(`${name} contract deployed`)
			console.log(`Address: ${deployedContract.address}`)
			return deployedContract.deployTransaction.wait()
		})
		.then(txr => {
			console.log(`Block: ${txr.blockNumber}`)
			console.log(`TX: ${polygonScanLink(txr.transactionHash, network)}`)
		})

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
