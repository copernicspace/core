import { ContractReceipt } from 'ethers'
// returns address from txr from PayloadFactory.create
/**
 * helper to parse tx receipt and find first payload factory event
 * 'PayloadCreated' to get new address of PayloadContract
 *
 * @param txr transaction receipt
 * @returns address of new payload contract created via factory
 */
export const getPayloadAddress = (txr: ContractReceipt): string =>
	txr.events
		.filter(e => e.event === 'PayloadCreated')
		.map(e => e.args.newAddress as string)
		.pop()
