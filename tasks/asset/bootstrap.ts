import { task } from 'hardhat/config'
import { CARGO_FACTORY_TASK } from '.'
import { CARGO_ASSET_TASK } from './cargoAsset.deploy'

/**
 * This bootstrap task deploys `CargoAsset` contract
 * for logic template, to pass as deploy argument to
 * `CargoFactory` contract.
 */
const CARGO_BOOTSTRAP = {
	NAME: 'cargo:bootstrap',
	DESC: 'Deploys cargo asset and cargo factory',

	PARAMS: {
		URI: 'uri',
		URI_DESC: 'uri for cargo asset ERC-1155'
	}
}

export default task(CARGO_BOOTSTRAP.NAME, CARGO_BOOTSTRAP.DESC)
	.addParam(CARGO_BOOTSTRAP.PARAMS.URI, CARGO_BOOTSTRAP.PARAMS.URI_DESC)
	.setAction(async ({ uri }, hre) => {
		const assetCargo = await hre.run(CARGO_ASSET_TASK.NAME, { uri: uri })
		console.log(`👨‍🚀 ${CARGO_ASSET_TASK.CONTRACT_NAME}\t:\t${assetCargo.address}`)

		const cargoFactory = await hre.run(CARGO_FACTORY_TASK.NAME, { address: assetCargo.address })
		console.log(`🏭 ${CARGO_FACTORY_TASK.CONTRACT_NAME}\t:\t${cargoFactory.address}`)
	})
