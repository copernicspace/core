import { BigNumber } from 'ethers'

interface BalanceType {
	money: BigNumber
	asset: BigNumber
}

interface Balance {
	buyer: BalanceType
	seller: BalanceType
	operator: BalanceType
}

export interface Balances {
	before?: Balance
	after?: Balance
}

export const balances = (): Balances => ({
	before: {
		buyer: { money: undefined, asset: undefined },
		seller: { money: undefined, asset: undefined },
		operator: { money: undefined, asset: undefined }
	},
	after: {
		buyer: { money: undefined, asset: undefined },
		seller: { money: undefined, asset: undefined },
		operator: { money: undefined, asset: undefined }
	}
})
