import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumberish } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import contractNames from '../../../../utils/constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../../utils/constants/tx-receipt-status'
import { InstantOffer, KycRegister, ERC20Mock, PayloadAsset } from '../../../../typechain'
import { getOfferSellID } from '../../../helpers/getOfferId.helper'
import { deployInstantOffer } from './fixtures/deployOffer.fixture'

describe('[spacemart/offers/instant/min-buy-amount.test.ts] InstantOffer: min buy amount', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister

	const rootId = 0

	let buyer: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , buyer] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, payloadAsset, kycContract } = await waffle.loadFixture(
				deployInstantOffer
			))
	)

	before('add buyer to KYC', async () => await kycContract.connect(deployer).setKycStatus(buyer.address, true))
	let erc20Mock: ERC20Mock
	before('Deploy ERC20 Mock', async () => {
		const name = 'MockToken'
		const symbol = 'MT'
		const decimals = 18

		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy(name, symbol, decimals))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	let offerId: BigNumberish
	const price = parseUnits('4250', 18)
	const amountToSell = parseUnits('100', 18)
	const minBuyAmount = parseUnits('10', 18)
	it('should create new offer', async () => {
		// approve offer contract before create sell offer
		await payloadAsset.connect(creator).setApprovalForAll(instantOffer.address, true)
		const txr = await instantOffer
			.connect(creator)
			.sell(payloadAsset.address, rootId, amountToSell, minBuyAmount, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	before('mint mock token', async () => await erc20Mock.connect(buyer).mint(minBuyAmount.mul(price)))

	before(
		'set allowance',
		async () => await erc20Mock.connect(buyer).approve(instantOffer.address, minBuyAmount.mul(price))
	)

	const buyAmount = parseUnits('10', 18)
	it('should revert on buy amount less min', async () =>
		await expect(instantOffer.connect(buyer).buy(offerId, buyAmount.div(2))).to.be.revertedWith(
			'Can not buy less than min amount'
		))

	it('should revert on buy amount less min', async () =>
		await expect(instantOffer.connect(buyer).buy(offerId, buyAmount.sub(1))).to.be.revertedWith(
			'Can not buy less than min amount'
		))

	it('should buy min amount', async () => {
		const txr = await instantOffer
			.connect(buyer)
			.buy(offerId, buyAmount)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
	})
})
