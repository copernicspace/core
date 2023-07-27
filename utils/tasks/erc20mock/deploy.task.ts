import { task } from 'hardhat/config'

const TASK = {
	NAME: 'erc20mock:deploy',
	DESC: 'deploys erc20 mock contract',
	CONTRACT_NAME: 'ERC20Mock'
}

export default task(TASK.NAME, TASK.DESC).setAction(
	async (args, hre) =>
		await hre.ethers
			.getContractFactory(TASK.CONTRACT_NAME)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
)
