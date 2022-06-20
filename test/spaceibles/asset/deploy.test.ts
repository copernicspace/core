import { waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('[spaceibles/asset/deploy]', () => {
	let deployer: SignerWithAddress
	let spaceibleAsset: SpaceibleAsset

	before(
		'load deploy fixture',
		async () => ({ deployer, spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset))
	)

	it('should have `success` status on `SpaceibleAsset` deploy tx receipt', async () =>
		spaceibleAsset.deployTransaction.wait().then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	it('should have admin role on deployer address', async () =>
		spaceibleAsset
			.DEFAULT_ADMIN_ROLE()
			.then(creator => spaceibleAsset.hasRole(creator, deployer.address))
			.then(result => expect(result).to.be.true))
})
