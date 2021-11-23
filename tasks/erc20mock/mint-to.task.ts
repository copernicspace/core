import { task } from 'hardhat/config'
import { parseUnits } from 'ethers/lib/utils'

const TASK = {
	NAME: 'erc20mock:mint-to',
	DESC: 'mints mock tokens to address',
	CONTRACT_NAME: 'ERC20Mock',

	PARAMS: {
		TO: 'to',
		TO_DESC: 'address to mint token to',

		AMOUNT: 'amount',
		AMOUNT_DESC: 'amount of tokens to be minted in decimal format',

		ADDRESS: 'address',
		ADDRESS_DESC: 'address of erc20mock token'
	}
}

export default task(TASK.NAME, TASK.DESC)
	.addParam(TASK.PARAMS.TO, TASK.PARAMS.TO_DESC)
	.addParam(TASK.PARAMS.AMOUNT, TASK.PARAMS.AMOUNT_DESC)
	.addParam(TASK.PARAMS.ADDRESS, TASK.PARAMS.ADDRESS_DESC)
	.setAction(
		async ({ to, amount, address }, hre) =>
			await hre.ethers
				.getContractAt(TASK.CONTRACT_NAME, address)
				.then(contract => contract)
				.then(erc20Mock => erc20Mock.mintTo(to, parseUnits(amount, 18)))
	)
