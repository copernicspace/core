import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import { SpacePayloadAsset } from '../../../typechain/SpacePayloadAsset'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

describe('[payload-pausable.test.ts] Space Payload Asset Pausable Interface tests', async () => {
	let deployer, user1, user2, user3, user4: SignerWithAddress
	before(
		'get signers from hh node',
		async () => ([deployer, user1, user2, user3, user4] = await ethers.getSigners())
	)

	let assetContract: SpacePayloadAsset
	before(
		'deploy asset contract',
		async () =>
			(assetContract = await ethers
				.getContractFactory('SpacePayloadAsset')
				.then(factory => factory.connect(deployer).deploy('TEST-URI'))
				.then(contract => contract.deployed())
				.then(deployedContract => deployedContract as SpacePayloadAsset))
	)

	it('deployed the asset contract successfully', async () =>
		await assetContract.deployTransaction
			.wait()
			.then(txr => expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)))

	before('create root asset', async () => {
		// ID: 1
		const root_create_tx = await assetContract
			.connect(user1)
			.createRootAsset(3500)
			.then(tx => tx.wait())
		const new_asset_args = root_create_tx.events
			.filter(events => events.event === 'RootAssetCreation')
			.pop().args
	})

	before('create child asset and deeper child assets', async () => {
		// ID: 2,   pID: 1
		await assetContract.connect(user1).createAsset(3000, 1)

		// ID: 3,   pID: 2
		await assetContract.connect(user1).createAsset(3000, 2)

		// ID: 4,   pID: 3
		await assetContract.connect(user1).createAsset(3000, 3)

		// ID: 5,   pID: 4
		await assetContract.connect(user1).createAsset(3000, 4)

		// ...
	})

	before('unpause all assets but the first one', async () => {
		// asset of ID: 2 still paused!

		// the rest unpaused
		await assetContract.connect(user1).unPauseAsset(3)
		await assetContract.connect(user1).unPauseAsset(4)
		await assetContract.connect(user1).unPauseAsset(5)
	})

	it('reverts transfer of asset if any asset in hierarchy above frozen', async () => {
		// approve user3 to manage user1's balance
		await assetContract.connect(user1).setApprovalForAll(user3.address, true)

		await expect(
			assetContract
				.connect(user3)
				.sendFrom(user1.address, user2.address, 5, BigInt(500 * 10 ** 18))
		).to.be.revertedWith('Asset in hierarchy paused')
	})
})
