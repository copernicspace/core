import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { PayloadAsset, PayloadFactory, KycRegister } from '../../../../typechain'
import { getPayloadAddress } from '../../../helpers/payloadAddress'
import contractNames from '../../../../utils/constants/contract.names'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { parentable } from './fixtures/parentable.fixture'

describe('[spacemart/assets/payload/kyc.test] `SpacePayload`: kyc test suite', () => {
	let userA, userB, userC, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB, userC] = await ethers.getSigners()))

	let payloadFactory: PayloadFactory
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let payloadAssetDecimals: BigNumber
	before(
		'load fixtures/deploy`',
		async () =>
			({ payloadFactory, payloadAsset, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		payloadAssetDecimals = await payloadAsset.decimals()
	})

	it('correctly set creator KYC permissions in fixture', async () => {
		const expected = await kycContract.getKycStatusInfo(creator.address)
		expect(expected).to.be.true
	})

	it('disallows creating child if user not on KYC list', async () => {
		payloadAssetDecimals = await payloadAsset.decimals()
		const amount = parseUnits('500', payloadAssetDecimals)

		// remove KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)

		await expect(
			payloadAsset
				.connect(creator)
				.createChild(amount, amount, 0, 'childSpacePayloadName', creator.address, 'TEST_CHILD_CID', 0)
		).to.be.revertedWith('sender/seller is not on KYC list')
	})

	it('correctly set creator KYC permissions in test above', async () => {
		const expected = await kycContract.getKycStatusInfo(creator.address)
		expect(expected).to.be.false
	})

	it('allows creating child if user on KYC list', async () => {
		// grant KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)
		const amount = parseUnits('500', payloadAssetDecimals)

		// create child to receiver
		const childID = await payloadAsset
			.connect(creator)
			.createChild(amount, amount, 0, 'childSpacePayloadName', creator.address, 'TEST_CHILD_CID', 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(childID).to.be.eq(BigNumber.from(2))

		const actual = await payloadAsset.balanceOf(creator.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})

	it('disallows creating asset if user not on KYC list', async () => {
		// remove userA perms
		await kycContract.connect(deployer).setKycStatus(userA.address, false)

		const amount = parseUnits('2000', payloadAssetDecimals)
		// add userA to payloadFactory perms
		await payloadFactory.connect(deployer).addClient(userA.address)

		await expect(
			payloadFactory
				.connect(userA)
				.create(
					'ipfs://',
					'userA test payload',
					payloadAssetDecimals,
					amount,
					kycContract.address,
					0,
					false,
					'TEST_ROOT_CID'
				)
		).to.be.revertedWith('receiver/buyer is not on KYC list')
	})

	let newPayloadContractAddress: string
	let newPayloadContract: PayloadAsset
	let amount: BigNumber
	let royalties: BigNumber

	before('create new root payload contract', async () => {
		amount = parseUnits('2000', payloadAssetDecimals)
		royalties = BigNumber.from(0)

		newPayloadContractAddress = await payloadFactory
			.connect(creator)
			.create(
				'ipfs://',
				'Second rootSpacePayload',
				payloadAssetDecimals,
				amount,
				kycContract.address,
				royalties,
				false,
				'TEST_ROOT_CID_NEW'
			)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))

		newPayloadContract = await ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, newPayloadContractAddress)
			.then(contract => contract as PayloadAsset)
	})

	it('correctly created new contract', async () => {
		// has correct URI
		const actual_uri = await newPayloadContract.uri(0)
		const expected_uri = 'ipfs://TEST_ROOT_CID_NEW'
		expect(expected_uri).to.be.eq(actual_uri)

		// has correct name
		const actual_name = await newPayloadContract.getName(0)
		const expected_name = 'Second rootSpacePayload'
		expect(expected_name).to.be.eq(actual_name)

		// has correct decimals
		const actual_decimals = await newPayloadContract.decimals()
		const expected_decimals = BigNumber.from(18)
		expect(expected_decimals).to.be.eq(actual_decimals)

		// has correct supply
		const actual_supply = await newPayloadContract.balanceOf(creator.address, 0)
		const expected_supply = parseUnits('2000', 18)
		expect(expected_supply).to.be.eq(actual_supply)
	})

	let newChildID: BigNumber
	let newAmount: BigNumber
	it('correctly created new child asset', async () => {
		await kycContract.connect(deployer).setKycStatus(userB.address, true)
		// use creator for new asset (they should already kave KYC permissions)
		const payloadAssetDecimals = await newPayloadContract.decimals()
		newAmount = parseUnits('500', payloadAssetDecimals)

		// create child to receiver (user B)
		newChildID = await newPayloadContract
			.connect(creator)
			.createChild(newAmount, newAmount, 0, 'new-new child', userB.address, 'TEST_CHILD_CID', 0)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		// has correct ID
		expect(newChildID).to.be.eq(BigNumber.from(1))

		// added correct child balance to userB
		const actual_child_bal = await newPayloadContract.balanceOf(userB.address, newChildID)
		const expected_child_bal = newAmount
		expect(expected_child_bal).to.be.eq(actual_child_bal)

		// set correct root balance of creator
		const actual_root_bal = await newPayloadContract.balanceOf(creator.address, 0)
		const expected_root_bal = parseUnits('1500', payloadAssetDecimals)
		expect(expected_root_bal).to.be.eq(actual_root_bal)
	})

	it('reverts on create new payload from non kyc user', async () => {
		const payloadAssetDecimals = await newPayloadContract.decimals()
		newAmount = parseUnits('500', payloadAssetDecimals)

		// create child to receiver (user B)
		const txr = newPayloadContract
			.connect(creator)
			.createChild(newAmount, newAmount, 0, 'new-new child', userC.address, 'TEST_CHILD_CID', 0)

		await expect(txr).to.be.revertedWith('receiver/buyer is not on KYC list')
	})

	it('disallows non-operators from setting KYC status', async () => {
		await expect(kycContract.connect(creator).setKycStatus(userB.address, true)).to.be.revertedWith(
			'unauthorized -- only for operators & admin'
		)
	})

	it('disallows non-admin from adding new operators', async () => {
		await expect(kycContract.connect(creator).setOperatorStatus(userA.address, true)).to.be.revertedWith(
			'unauthorized -- only for admin'
		)
	})

	it('correctly adds new operators from admin address', async () => {
		const start_status = await kycContract.getOperatorStatusInfo(userB.address)
		expect(await kycContract.connect(deployer).setOperatorStatus(userB.address, true))
		const end_status = await kycContract.getOperatorStatusInfo(userB.address)

		expect(start_status).to.be.false
		expect(end_status).to.be.true
	})

	it('correctly changes admin address', async () => {
		const start_status = await kycContract.currentAdmin()
		expect(await kycContract.connect(deployer).changeAdmin(userB.address))
		const end_status = await kycContract.currentAdmin()

		expect(start_status).to.be.eq(deployer.address)
		expect(end_status).to.be.eq(userB.address)

		await expect(kycContract.connect(deployer).setOperatorStatus(userA.address, true)).to.be.revertedWith(
			'unauthorized -- only for admin'
		)
	})

	it('defaults kyc status of an account to false', async () => {
		const [, , , , , account] = await ethers.getSigners()
		const actual = await kycContract.getKycStatusInfo(account.address)
		expect(actual).to.be.false
	})

	it('defaults operator status of an account to false', async () => {
		const [, , , , , , account] = await ethers.getSigners()
		const actual = await kycContract.getOperatorStatusInfo(account.address)
		expect(actual).to.be.false
	})
})
