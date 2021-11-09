import { task } from 'hardhat/config'

export const ERC20MOCK_DEPLOY_TASK = {
	NAME: 'erc20mock:deploy',
	DESC: 'deploys erc20 mock contract',
	CONTRACT_NAME: 'ERC20Mock'
}

export default task(ERC20MOCK_DEPLOY_TASK.NAME, ERC20MOCK_DEPLOY_TASK.DESC).setAction(
	async (args, hre) =>
		await hre.ethers
			.getContractFactory(ERC20MOCK_DEPLOY_TASK.CONTRACT_NAME)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
)
