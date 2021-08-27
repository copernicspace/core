import { BigNumber, ContractReceipt } from 'ethers'

export const getSellID =  (sellAssetTxReceipt: ContractReceipt) =>
	sellAssetTxReceipt.events
	.filter((e) => e.event === 'CloseSmartOffer')
	.map((e) => e.args.sellID)
	.pop()