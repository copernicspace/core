import { task } from 'hardhat/config'

export const SP_DEPLOY_TASK = {
	NAME: 'sp:deploy',
	DESC: 'deploys space pool contract',
	CONTRACT_NAME: 'SpacePool'
}

export default task(SP_DEPLOY_TASK.NAME, SP_DEPLOY_TASK.DESC)
	.setAction(
		async ({ money }, hre) =>
			await hre.ethers
				.getContractFactory(SP_DEPLOY_TASK.CONTRACT_NAME)
				.then(deployer => deployer.deploy(money))
				.then(contract => contract.deployed())
	)
