import { task } from 'hardhat/config'
import { TASK_NODE } from 'hardhat/builtin-tasks/task-names'
import { parseUnits } from 'ethers/lib/utils'

export const ERC20MOCK_MINT_TO_TASK = {
	NAME: 'erc20mock:mint-to',
	DESC: 'mints mock tokens to address',
	CONTRACT_NAME: 'ERC20Mock',

	TO: 'to',
	TO_DESC: 'address to mint token to',

	AMOUNT: 'amount',
	AMOUNT_DESC: 'amount of tokens to be minted in decimal format',

	ADDRESS: 'address',
	ADDRESS_DESC: 'address of erc20mock token'
}

export default task(ERC20MOCK_MINT_TO_TASK.NAME, ERC20MOCK_MINT_TO_TASK.DESC)
	.addParam(ERC20MOCK_MINT_TO_TASK.TO, ERC20MOCK_MINT_TO_TASK.TO_DESC)
	.addParam(ERC20MOCK_MINT_TO_TASK.AMOUNT, ERC20MOCK_MINT_TO_TASK.AMOUNT_DESC)
	.addParam(ERC20MOCK_MINT_TO_TASK.ADDRESS, ERC20MOCK_MINT_TO_TASK.ADDRESS_DESC)
	.setAction(
		async ({ to, amount, address }, hre) =>
			await hre.ethers
				.getContractAt(ERC20MOCK_MINT_TO_TASK.CONTRACT_NAME, address)
				.then(contract => contract)
				.then(erc20Mock => erc20Mock.mintTo(to, parseUnits(amount, 18)))
	)
