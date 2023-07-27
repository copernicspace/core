import { parseUnits } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumberish } from 'ethers'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../../utils/constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../../utils/constants/tx-receipt-status'
import { InstantOffer, PayloadAsset, KycRegister, ERC20Mock } from '../../../../typechain'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { getOfferSellID } from '../../../helpers/getOfferId.helper'
import { deployInstantOfferWithRoyalties } from './fixtures/deployOffer.fixture'

describe('[spacemart/offers/instant/secondary-royalties]', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister

	let erc20Mock: ERC20Mock

	let userA: SignerWithAddress
	let userB: SignerWithAddress
	let userC: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , userA, userB, userC] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOfferWithRoyalties`',
		async () =>
			({ deployer, creator, instantOffer, payloadAsset, kycContract } = await waffle.loadFixture(
				deployInstantOfferWithRoyalties
			))
	)

	before('add users to KYC', async () => {
		await kycContract.connect(deployer).setKycStatus(userA.address, true)
		await kycContract.connect(deployer).setKycStatus(userB.address, true)
		await kycContract.connect(deployer).setKycStatus(userC.address, true)
	})

	before('Deploy ERC20 Mock and mint to users', async () => {
		const name = 'MockToken'
		const symbol = 'MT'
		const decimals = 18

		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy(name, symbol, decimals))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)

		await erc20Mock.mintTo(userA.address, parseUnits('1000', 18))
		await erc20Mock.mintTo(userB.address, parseUnits('1000', 18))
		await erc20Mock.mintTo(userC.address, parseUnits('1000', 18))
	})

	let childID: BigNumberish
	const childSupply = parseUnits('10', 18)
	const burnAmount = parseUnits('100', 18)
	it('create payload child asset to to userA', async () => {
		const txr = await payloadAsset
			.connect(creator)
			.createChild(
				childSupply,
				burnAmount,
				0,
				'child-payload-test',
				userA.address,
				'TEST_CID',
				parseUnits('3', 18)
			)
			.then(tx => tx.wait())

		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		childID = getAssetID(txr)
	})

	const price = parseUnits('10', 18)
	let listingID
	it('create listing for child asset', async () => {
		await payloadAsset.connect(userA).setApprovalForAll(instantOffer.address, true)
		const txr = await instantOffer
			.connect(userA)
			.sell(payloadAsset.address, childID, childSupply, parseUnits('1', 18), price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)

		listingID = getOfferSellID(txr)
	})

	const buyAmount = 1
	it('buy from userB', async () => {
		const priceAmount = price.mul(buyAmount)
		await erc20Mock.connect(userB).approve(instantOffer.address, priceAmount)

		await expect(() =>
			instantOffer.connect(userB).buy(listingID, parseUnits(buyAmount.toString(), 18))
		).to.changeTokenBalances(
			erc20Mock,
			[deployer, creator, userA, userB],
			[
				priceAmount.mul(3).div(100), // platform fee to `deployer`
				priceAmount.mul(5).div(100), // royalties to creator
				priceAmount.mul(92).div(100), // rest to seller
				priceAmount.mul(-1)
			]
		)
	})

	let resellListingID
	it('create secondary resell', async () => {
		await payloadAsset.connect(userB).setApprovalForAll(instantOffer.address, true)
		const txr = await instantOffer
			.connect(userB)
			.sell(payloadAsset.address, childID, parseUnits('1', 18), parseUnits('1', 18), price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)

		resellListingID = getOfferSellID(txr)
	})

	it('should have correct secondary royalties on resell from not child creator', async () => {
		const priceAmount = price.mul(buyAmount)
		await erc20Mock.connect(userC).approve(instantOffer.address, priceAmount)

		await expect(() =>
			instantOffer.connect(userC).buy(resellListingID, parseUnits(buyAmount.toString(), 18))
		).to.changeTokenBalances(
			erc20Mock,
			[deployer, creator, userA, userB, userC],
			[
				priceAmount.mul(3).div(100), // platform fee to `deployer`
				priceAmount.mul(5).div(100), // royalties to root creator
				priceAmount.mul(3).div(100), // royalties to child creator
				priceAmount.mul(89).div(100), // rest to seller
				priceAmount.mul(-1)
			]
		)
	})
})
