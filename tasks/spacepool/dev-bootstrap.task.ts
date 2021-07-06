import { task } from 'hardhat/config'
import { SP_DEPLOY_TASK } from './deploy.task'
import { ERC20MOCK_DEPLOY_TASK } from '../erc20mock/deploy.task'

const TASK = {
	NAME: 'sp:dev',
	DESC: 'Deploy space pool and mock erc20 contracts, add second wallet signer as liquidity operator'
}

export default task(TASK.NAME, TASK.DESC)
	.setAction(
		async (args, hre) => {
			// step 0: deploy erc20mock as money
			const moneyAddress = await hre.run(ERC20MOCK_DEPLOY_TASK.NAME)
			console.log(`Deployed ${ERC20MOCK_DEPLOY_TASK.CONTRACT_NAME} contract\t address:${moneyAddress}`)

			// step 1: run space pool deploy task
			const spacePoolAddress = await hre.run(SP_DEPLOY_TASK.NAME, { money: moneyAddress })
			console.log(`Deployed ${SP_DEPLOY_TASK.CONTRACT_NAME} contract\t address:${spacePoolAddress}`)
		}
	)
