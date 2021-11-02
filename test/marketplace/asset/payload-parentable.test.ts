import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import { SpacePayloadAsset } from '../../../typechain/SpacePayloadAsset'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

describe('[payload-parentable.test.ts] Space Payload Asset Parentable Interface tests', async () => {
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
		const root_create_tx = await assetContract
			.connect(user1)
			.createRootAsset(3500)
			.then(tx => tx.wait())
		const new_asset_args = root_create_tx.events
			.filter(events => events.event === 'RootAssetCreation')
			.pop().args

		// asset creation event
		expect(new_asset_args._id).to.be.eq(1)
		expect(new_asset_args._to).to.be.eq(user1.address)
		expect(new_asset_args._amount).to.be.eq(BigInt(3500 * 10 ** 18))

		// creator's balance
		const us1_bal = await assetContract.balanceOf(user1.address, new_asset_args._id)
		expect(us1_bal).to.be.eq(BigInt(3500 * 10 ** 18))
	})

	/* 
        Create child asset based on Root Asset with id 1
    */

	it('correctly creates child space payload asset', async () => {
		const create_tx = await assetContract
			.connect(user1)
			.createAsset(2000, 1)
			.then(tx => tx.wait())
		const new_asset_args = create_tx.events
			.filter(events => events.event === 'AssetCreation')
			.pop().args

		// asset creation event
		expect(new_asset_args._id).to.be.eq(2)
		expect(new_asset_args._to).to.be.eq(user1.address)
		expect(new_asset_args._amount).to.be.eq(BigInt(2000 * 10 ** 18))
		expect(new_asset_args._pid).to.be.eq(1)

		// creator's balance
		const us1_bal = await assetContract.balanceOf(user1.address, new_asset_args._id)
		expect(us1_bal).to.be.eq(BigInt(2000 * 10 ** 18))
	})

	it('disallows creating child assets based on an asset not owned by creator', async () => {
		await expect(assetContract.connect(user2).createAsset(1000, 1)).to.be.revertedWith(
			'Required child asset weight exceeds the creator balance'
		)
	})

	it('can create child asset based on a token owned but not created', async () => {
		// approve user3 to manage user1's balance
		await assetContract.connect(user1).setApprovalForAll(user3.address, true)

		// unpause asset for transfer
		await assetContract.connect(user1).unPauseAsset(1)

		// Transfer some weight to user 3 for testing
		const start_b_3 = await (await assetContract.balanceOf(user3.address, 1)).toBigInt()
		await assetContract
			.connect(user3)
			.sendFrom(user1.address, user3.address, 1, BigInt(500 * 10 ** 18))
		const end_b_3 = await (await assetContract.balanceOf(user3.address, 1)).toBigInt()

		expect(start_b_3.toString()).to.be.eq('0')
		expect(end_b_3.toString()).to.be.eq((start_b_3 + BigInt(500 * 10 ** 18)).toString())

		const create_tx = await assetContract
			.connect(user3)
			.createAsset(300, 1)
			.then(tx => tx.wait())
		const new_asset_args = create_tx.events
			.filter(events => events.event === 'AssetCreation')
			.pop().args

		// asset creation event
		expect(new_asset_args._id).to.be.eq(3)
		expect(new_asset_args._to).to.be.eq(user3.address)
		expect(new_asset_args._amount).to.be.eq(BigInt(300 * 10 ** 18))
		expect(new_asset_args._pid).to.be.eq(1)

		expect(await assetContract.parentIds(3)).to.be.eq(1)

		// creator's balance
		const us3_bal = await assetContract.balanceOf(user3.address, new_asset_args._id)
		expect(us3_bal).to.be.eq(BigInt(300 * 10 ** 18))
	})

	it('cannot create child asset if balance too low', async () => {
		await expect(assetContract.connect(user3).createAsset(600, 1)).to.be.revertedWith(
			'Required child asset weight exceeds the creator balance'
		)
	})
})
