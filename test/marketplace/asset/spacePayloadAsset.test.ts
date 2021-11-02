import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import { SpacePayloadAsset } from '../../../typechain/SpacePayloadAsset'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'

describe('[SpacePayloadAsset.test.ts] Space Payload Asset test suite', async () => {
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

	it('correctly creates space payload asset', async () => {
		const create_tx = await assetContract
			.connect(user1)
			.createAsset(3500)
			.then(tx => tx.wait())
		const new_asset_args = create_tx.events
			.filter(events => events.event === 'AssetCreation')
			.pop().args

		// asset creation event
		expect(new_asset_args._id).to.be.eq(1)
		expect(new_asset_args._to).to.be.eq(user1.address)
		expect(new_asset_args._amount).to.be.eq(BigInt(3500 * 10 ** 18))

		// creator's balance
		const us1_bal = await assetContract.balanceOf(user1.address, new_asset_args._id)
		expect(us1_bal).to.be.eq(BigInt(3500 * 10 ** 18))
	})

	it('locks the contract after asset creation', async () => {
		const locked_state = await assetContract.paused()
		expect(locked_state).to.be.true
	})

	it('disallows non-asset owners from freezing/unfeezing', async () => {
		await expect(assetContract.connect(user2).pauseAsset(1)).to.be.revertedWith(
			'Not owner'
		)
		await expect(assetContract.connect(user2).unpauseAsset(1)).to.be.revertedWith(
			'Not owner'
		)
	})

	it('allows the owner to unfreeze/freeze asset', async () => {
		const start_state = await assetContract.paused()
		await assetContract.connect(user1).unpauseAsset(1)
		const end_state = await assetContract.paused()

		expect(start_state).to.be.true
		expect(end_state).to.be.false

		const start_state2 = await assetContract.paused()
		await assetContract.connect(user1).pauseAsset(1)
		const end_state2 = await assetContract.paused()

		expect(start_state2).to.be.false
		expect(end_state2).to.be.true
	})

	it('reverts transfer when paused', async () => {
		await expect(
			assetContract.connect(user1).send(user2.address, 1, BigInt(100 * 10 ** 18))
		).to.be.revertedWith('Pausable: paused')
	})

	it('reverts transferFrom when paused', async () => {
		// approve user2 to manage user1's balance
		await assetContract.connect(user1).setApprovalForAll(user2.address, true)

		// test revert
		await expect(
			assetContract
				.connect(user2)
				.sendFrom(user1.address, user2.address, 1, BigInt(50 * 10 ** 18))
		).to.be.revertedWith('Pausable: paused')
	})

	let transferTx, transferFromTx

	it('successfully transfers balance during send', async () => {
		// unpause asset
		await assetContract.connect(user1).unpauseAsset(1)

		const start_bal1 = await (await assetContract.balanceOf(user1.address, 1)).toBigInt()
		const start_bal2 = await (await assetContract.balanceOf(user2.address, 1)).toBigInt()

		transferTx = await assetContract
			.connect(user1)
			.send(user2.address, 1, BigInt(500 * 10 ** 18))
			.then(tx => tx.wait())

		const end_bal1 = await (await assetContract.balanceOf(user1.address, 1)).toBigInt()
		const end_bal2 = await (await assetContract.balanceOf(user2.address, 1)).toBigInt()

		// turn to string because chai's expect does not support big int
		// and BigNumber experiences overflow with such big numbers
		const end_1_supposed = (start_bal1 - BigInt(500 * 10 ** 18)).toString()
		const end_2_supposed = (start_bal2 + BigInt(500 * 10 ** 18)).toString()

		await expect(end_bal1.toString()).to.be.eq(end_1_supposed)
		await expect(end_bal2.toString()).to.be.eq(end_2_supposed)
		await expect(end_bal1.toString()).to.be.eq(BigInt(3000 * 10 ** 18).toString())
		await expect(end_bal2.toString()).to.be.eq(BigInt(500 * 10 ** 18).toString())
	})

	it('successfully transfers balance during transferFrom', async () => {
		// approve user2 to manage user1's balance
		await assetContract.connect(user1).setApprovalForAll(user2.address, true)

		const start_bal1 = await (await assetContract.balanceOf(user1.address, 1)).toBigInt()
		const start_bal3 = await (await assetContract.balanceOf(user3.address, 1)).toBigInt()

		transferFromTx = await assetContract
			.connect(user2)
			.sendFrom(user1.address, user3.address, 1, BigInt(500 * 10 ** 18))
			.then(tx => tx.wait())

		const end_bal1 = await (await assetContract.balanceOf(user1.address, 1)).toBigInt()
		const end_bal3 = await (await assetContract.balanceOf(user3.address, 1)).toBigInt()

		// turn to string because chai's expect does not support big int
		// and BigNumber experiences overflow with such big numbers
		const end_1_supposed = (start_bal1 - BigInt(500 * 10 ** 18)).toString()
		const end_3_supposed = (start_bal3 + BigInt(500 * 10 ** 18)).toString()

		await expect(end_bal1.toString()).to.be.eq(end_1_supposed)
		await expect(end_bal3.toString()).to.be.eq(end_3_supposed)
		await expect(end_bal1.toString()).to.be.eq(BigInt(2500 * 10 ** 18).toString())
		await expect(end_bal3.toString()).to.be.eq(BigInt(500 * 10 ** 18).toString())
	})

	it('reverts transfer if insufficient balance', async () => {
		await expect(
			assetContract.connect(user4).send(user3.address, 1, BigInt(50 * 10 ** 18))
		).to.be.revertedWith('Insufficient balance')
	})

	it('reverts transferFrom if insufficient balance', async () => {
		await expect(
			assetContract
				.connect(user2)
				.sendFrom(user1.address, user3.address, 1, BigInt(4500 * 10 ** 18))
		).to.be.revertedWith('Insufficient balance')
	})

	it('reverts transferFrom if not approved', async () => {
		await expect(
			assetContract
				.connect(user3)
				.sendFrom(user1.address, user3.address, 1, BigInt(500 * 10 ** 18))
		).to.be.revertedWith('Required operator is not approved by owner')
	})

	it('emits correct event data during transfer', async () => {
		const transfer_args = transferTx.events
			.filter(events => events.event === 'Transfer')
			.pop().args

		expect(transfer_args._to).to.be.eq(user2.address)
		expect(transfer_args._id).to.be.eq(1)
		expect(transfer_args._amount.toString()).to.be.eq(BigInt(500 * 10 ** 18).toString())
	})

	it('emits correct event data during transferFrom', async () => {
		const transferFrom_args = transferFromTx.events
			.filter(events => events.event === 'TransferFrom')
			.pop().args

		expect(transferFrom_args._from).to.be.eq(user1.address)
		expect(transferFrom_args._to).to.be.eq(user3.address)
		expect(transferFrom_args._id).to.be.eq(1)
		expect(transferFrom_args._amount.toString()).to.be.eq(
			BigInt(500 * 10 ** 18).toString()
		)
	})
})
