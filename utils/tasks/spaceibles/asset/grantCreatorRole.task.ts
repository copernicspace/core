import { task } from 'hardhat/config'
import { polygonScanLink } from '../../../polygonScanLink'
import contractNames from '../../../constants/contract.names'

export const GRANT_CREATOR_ROLE = {
	NAME: 'spaceibles:grantCreatorRole',
	DESC: 'grant `CREATOR_ROLE` to selected address',
	CONTRACT_NAME: contractNames.SPACEIBLE_ASSET,

	PARAMS: {
		SPACEIBLE_ASSET_ADDRESS: 'asset',
		SPACEIBLE_ASSET_ADDRESS_DESC: 'address of deployed spaceibe asset',

		CLIENT_ADDRESS: 'client',
		CLIENT_ADDRESS_DESC: 'address of new client to grant `CREATOR_ROLE`'
	}
}

export default task(GRANT_CREATOR_ROLE.NAME, GRANT_CREATOR_ROLE.DESC)
	.addParam(GRANT_CREATOR_ROLE.PARAMS.SPACEIBLE_ASSET_ADDRESS, GRANT_CREATOR_ROLE.PARAMS.SPACEIBLE_ASSET_ADDRESS_DESC)
	.addParam(GRANT_CREATOR_ROLE.PARAMS.CLIENT_ADDRESS, GRANT_CREATOR_ROLE.PARAMS.CLIENT_ADDRESS_DESC)
	.setAction(
		async ({ asset, client }, hre) =>
			await hre.ethers
				.getContractAt(GRANT_CREATOR_ROLE.CONTRACT_NAME, asset)
				.then(contract => contract.grantCreatorRole(client))
				.then(tx => console.log(polygonScanLink(tx.hash, hre.network.name)))
	)
