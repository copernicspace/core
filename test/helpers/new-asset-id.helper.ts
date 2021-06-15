import { BigNumber, ContractReceipt } from 'ethers'
// bug
// if there are > 1 events in tx receipt -- this wont work
export const getAssetID =  (newAssetTxReceipt: ContractReceipt): BigNumber =>
	newAssetTxReceipt.events
		.filter((e) => e.event === 'TransferSingle')
		.map((e) => e.args.id as BigNumber)
		.pop()

