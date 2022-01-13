import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { deployInstantOffer } from './fixtures/deployInstantOffer.fixture'
import { CargoAsset, InstantOffer, KycRegister, ERC20Mock } from '../../../typechain'
import contractNames from '../../../constants/contract.names'
import { BigNumber, BigNumberish, ContractReceipt } from 'ethers'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getOfferSellID } from '../../helpers/getOfferId.helper'
import { parseUnits } from '@ethersproject/units'

describe('instant offer: `buy` test suite', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let instantOffer: InstantOffer
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let totalSupply: BigNumber

	const rootId = 0

	let userA: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA] = await ethers.getSigners()))

	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await waffle.loadFixture(
				deployInstantOffer
			))
	)

	let erc20Mock: ERC20Mock
	before(' deploy ERC20 Mock', async () => {
		erc20Mock = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy())
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)
	})

	let offerId: BigNumberish
	const price = parseUnits('4250', 18)
	it('should create new offer', async () => {
		// approve offer contract before create sell offer
		await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)

		const txr = await instantOffer
			.connect(creator)
			.sell(rootId, totalSupply, price, erc20Mock.address)
			.then(tx => tx.wait())
		expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
		offerId = getOfferSellID(txr)
	})

	const buyAmount = parseUnits('100', 18)
	it('should have success status of buy tx', async () => {
		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply)
		const approveAmount = price.mul(buyAmount)
		await erc20Mock.connect(userA).mint(approveAmount)
		await erc20Mock.connect(userA).approve(instantOffer.address, approveAmount)
		await kycContract.connect(deployer).setKycStatus(userA.address, true)

		const buyTxr = await instantOffer
			.connect(userA)
			.buy(offerId, buyAmount)
			.then(tx => tx.wait())

		expect(await cargoContract.balanceOf(creator.address, rootId)).to.be.eq(totalSupply.sub(buyAmount))
		expect(await cargoContract.balanceOf(userA.address, rootId)).to.be.eq(buyAmount)
	})
})
