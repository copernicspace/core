import { task } from 'hardhat/config'

export const SET_TEMPLATE_TASK = {
	NAME: 'cargoFactory:setTemplateAddress',
	DESC: 'set tempalte address for clone',
	CONTRACT_NAME: 'CargoFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of cargo factory contraact',

		CARGO_ADDRESS: 'template',
		CARGO_ADDRESS_DESC: 'address of deployed cargo asset to use as logic template for clones'
	}
}

export default task(SET_TEMPLATE_TASK.NAME, SET_TEMPLATE_TASK.DESC)
	.addParam(SET_TEMPLATE_TASK.PARAMS.FACTORY_ADDRESS, SET_TEMPLATE_TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(SET_TEMPLATE_TASK.PARAMS.CARGO_ADDRESS, SET_TEMPLATE_TASK.PARAMS.CARGO_ADDRESS_DESC)
	.setAction(
		async ({ template, factory }, hre) =>
			await hre.ethers
				.getContractAt(SET_TEMPLATE_TASK.CONTRACT_NAME, factory)
				.then(factory => factory.setTemplateAddress(template))
	)
