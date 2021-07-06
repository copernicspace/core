import { task } from 'hardhat/config'
import { SP_DEPLOY_TASK } from './deploy.task'
import { ERC20MOCK_DEPLOY_TASK } from '../erc20mock/deploy.task'
import { ERC20Mock, SpacePool } from '../../typechain'

const TASK = {
	NAME: 'sp:dev',
	DESC: 'Deploy space pool and mock erc20 contracts, add second wallet signer as liquidity operator'
}

export default task(TASK.NAME, TASK.DESC)
	.setAction(
		async (args, hre) => {
			// step 0: deploy erc20mock as money
			const money: ERC20Mock = await hre.run(ERC20MOCK_DEPLOY_TASK.NAME)
			console.log(`Deployed ${ERC20MOCK_DEPLOY_TASK.CONTRACT_NAME} contract\t address:${money.address}`)

			// step 1: run space pool deploy task
			const spacePool: SpacePool = await hre.run(SP_DEPLOY_TASK.NAME, { money: money.address })
			console.log(`Deployed ${SP_DEPLOY_TASK.CONTRACT_NAME} contract\t address:${spacePool.address}`)

			// step 2: add second wallet from deterministic hh wallet as liquidity operator
			// step 2.1 load signers
			const [deployer, liquidityOperator] = await hre.ethers.getSigners()
			await spacePool.connect(deployer).addLiquidityOperator(liquidityOperator.address)
			const liqOperRole = await spacePool.LIQUIDITY_OPERATOR()
			if (await spacePool.hasRole(liqOperRole, liquidityOperator.address))
				console.log(`Now ${liquidityOperator.address} has next role: LIQUIDITY_OPERATOR:${liqOperRole}`)
			else
				throw new Error('failed to set liquidity operator role')
		}
	)
