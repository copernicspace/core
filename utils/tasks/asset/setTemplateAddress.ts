import { task } from 'hardhat/config'

export const SET_TEMPLATE_TASK = {
	NAME: 'payloadFactory:setTemplateAddress',
	DESC: 'set tempalte address for clone',
	CONTRACT_NAME: 'PayloadFactory',

	PARAMS: {
		FACTORY_ADDRESS: 'factory',
		FACTORY_ADDRESS_DESC: 'address of payload factory contraact',

		PAYLOAD_ADDRESS: 'template',
		PAYLOAD_ADDRESS_DESC: 'address of deployed payload asset to use as logic template for clones'
	}
}

export default task(SET_TEMPLATE_TASK.NAME, SET_TEMPLATE_TASK.DESC)
	.addParam(SET_TEMPLATE_TASK.PARAMS.FACTORY_ADDRESS, SET_TEMPLATE_TASK.PARAMS.FACTORY_ADDRESS_DESC)
	.addParam(SET_TEMPLATE_TASK.PARAMS.PAYLOAD_ADDRESS, SET_TEMPLATE_TASK.PARAMS.PAYLOAD_ADDRESS_DESC)
	.setAction(
		async ({ template, factory }, hre) =>
			await hre.ethers
				.getContractAt(SET_TEMPLATE_TASK.CONTRACT_NAME, factory)
				.then(factory => factory.setTemplateAddress(template))
	)
