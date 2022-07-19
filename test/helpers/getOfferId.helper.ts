import { BigNumber, ContractReceipt } from 'ethers'
// todo: BUG: if tx receipt has > 1 'TransferSingle' events - wont work
export const getOfferSellID = (txr: ContractReceipt): BigNumber =>
	txr.events
		.filter(e => e.event === 'NewOffer')
		.map(e => e.args.sellID as BigNumber)
		.pop()

export const getOfferId = (txr: ContractReceipt): BigNumber =>
	txr.events
		.filter(e => e.event === 'Sell')
		.map(e => e.args.id as BigNumber)
		.pop()
