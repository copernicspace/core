import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { CargoAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../typechain'
import { BigNumber } from 'ethers'
import { expect } from 'chai'
import { parseUnits } from '@ethersproject/units'
import { createRootOffer } from './fixtures/createRootOffer.fixture'

describe('instant offer: `buy` test suite', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber
	let money: ERC20Mock
	let sellID: BigNumber

	const rootId = 0

	let userA: SignerWithAddress

	before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply, money, sellID } =
				await waffle.loadFixture(createRootOffer))
	)
	describe('set correct parameters of new offer', async () => {
		let seller: string
		let assetID: BigNumber
		let price: BigNumber
		let money: string
		before('load offer parameters', async () => {
			;[seller, assetID, price, money] = await instantOffer.getSmartOffer(sellID)
		})
		it('set correct seller', async () => {
			expect(seller).to.be.eq(creator.address)
		})
		it('set correct assetID', async () => {
			expect(assetID).to.be.eq(rootId)
		})
		it('set correct price', async () => {
			expect(price).to.be.eq(parseUnits('4250', 18))
		})
		it('set correct money address', async () => {
			expect(money).to.be.eq(await money)
		})
	})
})
