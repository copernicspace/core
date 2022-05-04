import { task } from 'hardhat/config'
import { PAYLOAD_FACTORY_TASK } from '.'
import { PAYLOAD_ASSET_TASK } from './payloadAsset.deploy'

/**
 * This bootstrap task deploys `PayloadAsset` contract
 * for logic template, to pass as deploy argument to
 * `PayloadFactory` contract.
 */
const PAYLOAD_BOOTSTRAP = {
	NAME: 'payload:bootstrap',
	DESC: 'Deploys payload asset and payload factory',

	PARAMS: {
		URI: 'uri',
		URI_DESC: 'uri for payload asset ERC-1155'
	}
}

export default task(PAYLOAD_BOOTSTRAP.NAME, PAYLOAD_BOOTSTRAP.DESC)
	.addParam(PAYLOAD_BOOTSTRAP.PARAMS.URI, PAYLOAD_BOOTSTRAP.PARAMS.URI_DESC)
	.setAction(async ({ uri }, hre) => {
		const assetPayload = await hre.run(PAYLOAD_ASSET_TASK.NAME, { uri: uri })
		console.log(`👨‍🚀 ${PAYLOAD_ASSET_TASK.CONTRACT_NAME}\t:\t${assetPayload.address}`)

		const payloadFactory = await hre.run(PAYLOAD_FACTORY_TASK.NAME, { address: assetPayload.address })
		console.log(`🏭 ${PAYLOAD_FACTORY_TASK.CONTRACT_NAME}\t:\t${payloadFactory.address}`)
	})
