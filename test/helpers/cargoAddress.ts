import { ContractReceipt } from 'ethers'
// returns address from txr from CargoFactory.create
/**
 * helper to parse tx receipt and find first cargo factory event
 * 'CargoCreated' to get new address of CargoContract
 *
 * @param txr transaction receipt
 * @returns address of new cargo contract created via factory
 */
export const getCargoAddress = (txr: ContractReceipt): string =>
	txr.events
		.filter(e => e.event === 'CargoCreated')
		.map(e => e.args.newCargoAddress as string)
		.pop()
