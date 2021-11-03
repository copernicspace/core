import { BigNumber, ContractReceipt } from 'ethers'
// todo: BUG: if tx receipt has > 1 'TransferSingle' events - wont work
export const getAssetID = (txr: ContractReceipt): BigNumber =>
	txr.events
		.filter(e => e.event === 'TransferSingle')
		.map(e => e.args.id as BigNumber)
		.pop()
