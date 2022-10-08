import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { PayloadAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../../typechain'
import contractNames from '../../../../constants/contract.names'
import { TX_RECEIPT_STATUS } from '../../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../../helpers/getOfferId.helper'
import { deployInstantOfferWithRoyalties } from './fixtures/deployOffer.fixture'

describe('[spacemart/offers/instant/royalties-offer.test] Instant offer with royalties', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber
	let decimals: BigNumber

	const rootId = 0

	let userA: SignerWithAddress
	let userB: SignerWithAddress

	before('load userA and userB as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOfferWithRoyalties`',
		async () =>
			({ deployer, creator, instantOffer, payloadAsset, kycContract, totalSupply, decimals } =
				await waffle.loadFixture(deployInstantOfferWithRoyalties))
	)

	let erc20Mock: ERC20Mock
	before('deploy ERC20 Mock', async () => {
		const name = 'MockToken'
		const symbol = 'MT'
		const decimals = 18

		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy(name, symbol, decimals))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	let sellID: BigNumberish
	const price = parseUnits('4250', decimals)
	const minBuyAmount = parseUnits('10', decimals)
	it('should create new offer', async () => {
		await payloadAsset.connect(creator).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(payloadAsset.address, rootId, totalSupply.div(100), minBuyAmount, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		sellID = getOfferSellID(txr)
	})

	before('add kyc status to userA', async () => await kycContract.connect(deployer).setKycStatus(userA.address, true))
	before('add kyc status to userB', async () => await kycContract.connect(deployer).setKycStatus(userB.address, true))

	const buyAmount = '10'
	const priceAmount = price.mul(buyAmount)
	it('should have correct creator balance of payload asset  before sell', async () =>
		expect(await payloadAsset.balanceOf(creator.address, rootId)).to.be.eq(totalSupply))

	before('mint to userA and approve instantOffer contract', async () => {
		await erc20Mock.connect(userA).mint(priceAmount)
		await erc20Mock.connect(userA).approve(instantOffer.address, priceAmount)
	})

	it('should have correct balances changes after buy tx', async () =>
		await expect(() =>
			instantOffer.connect(userA).buy(sellID, parseUnits(buyAmount, decimals))
		).to.changeTokenBalances(
			erc20Mock,
			[deployer, creator, userA],
			[priceAmount.mul(3).div(100), priceAmount.mul(97).div(100), priceAmount.mul(-1)]
		))

	let resellID: BigNumberish
	const resellPrice = parseUnits('10000', decimals)
	it('should create resell listing from userA', async () => {
		await payloadAsset.connect(userA).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(userA)
			.sell(
				payloadAsset.address,
				rootId,
				parseUnits(buyAmount, decimals),
				parseUnits('1', decimals),
				resellPrice,
				erc20Mock.address
			)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		resellID = getOfferSellID(txr)
	})

	before('mint to userB and approve instantOffer contract', async () => {
		await erc20Mock.connect(userB).mint(resellPriceAmount)
		await erc20Mock.connect(userB).approve(instantOffer.address, resellPriceAmount)
	})

	const resellPriceAmount = resellPrice.mul(buyAmount)
	it('should have correct balances changes after buy tx on resell listing', async () =>
		await expect(() =>
			instantOffer.connect(userB).buy(resellID, parseUnits(buyAmount, decimals))
		).to.changeTokenBalances(
			erc20Mock,
			[deployer, creator, userA, userB],
			[
				resellPriceAmount.mul(3).div(100),
				resellPriceAmount.mul(5).div(100),
				resellPriceAmount.mul(92).div(100),
				resellPriceAmount.mul(-1)
			]
		))
})
