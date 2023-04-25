import { polygonScanLink } from './polygonScanLink'

// @TODO refactor to be multichain support
export const deployDetails = (contractName, txr, network: string) => {
	console.log(`${contractName} contract deployed on ${network}`)
	console.log(`block_number: ${txr.blockNumber}`)
	console.log(`contract_address: ${txr.contractAddress}`)
	console.log(`tx_hash: ${polygonScanLink(txr.transactionHash, network)}`)
}
