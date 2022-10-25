import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'
import { ERC20Mock, EscrowListing, KycRegister, PayloadAsset, PayloadFactory } from '../../../../typechain'
import { deployEscrowListing } from './fixtures/deploy.fixture'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { getPayloadAddress } from '../../../helpers/payloadAddress'
import contractNames from '../../../../constants/contract.names'
import { getOfferId } from '../../../helpers/getOfferId.helper'
import { getContractFactory } from '@nomiclabs/hardhat-ethers/types'

describe('[spacemart/offers/escrow/sell]', () => {
	let deployer: SignerWithAddress
	let creator: SignerWithAddress
	let payloadFactory: PayloadFactory
	let kycContract: KycRegister
	let escrowListing: EscrowListing
	let decimals: number

	before(
		'load `fixtures/deployInstantOffer`',
		async () =>
			({ deployer, creator, payloadFactory, kycContract, escrowListing, decimals } = await waffle.loadFixture(
				deployEscrowListing
			))
	)

	let user: SignerWithAddress
	let anotherUser: SignerWithAddress
	before('load user signers', async () => ([, , user, anotherUser] = await ethers.getSigners()))

	before(
		'add creator as factory client',
		async () => await payloadFactory.connect(deployer).addClient(creator.address)
	)

	before('add creator, user and another user to KYC', async () => {
		await kycContract.connect(deployer).setKycStatus(creator.address, true)
		await kycContract.connect(deployer).setKycStatus(user.address, true)
		await kycContract.connect(deployer).setKycStatus(anotherUser.address, true)
	})

	let money: ERC20Mock
	before('deploy erc20 mock', async () => {
		money = await ethers
			.getContractFactory(contractNames.ERC20_MOCK)
			.then(factory => factory.deploy('MockToken', 'MT', 18))
			.then(contract => contract.deployed())
			.then(deployedContract => deployedContract as ERC20Mock)

		await money.connect(user).mint(parseUnits('1000000', 18))
	})

	let assetAddress
	it('should create new payload asset from creator', async () => {
		assetAddress = await payloadFactory
			.connect(creator)
			.create(
				'ipfs://',
				'rootDigitalPayload',
				decimals,
				parseUnits('100', decimals),
				kycContract.address,
				parseUnits('3', decimals),
				false,
				'TEST_CID'
			)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))
	})

	let payloadAsset: PayloadAsset
	it('set allowance for child create to escrowListing contract', async () => {
		payloadAsset = await ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, assetAddress)
			.then(contract => contract as PayloadAsset)
		await payloadAsset.connect(creator).setCreateChildAllowance(escrowListing.address, true)
	})

	let listingID
	const price = parseUnits('10', 18 - 6)
	it('should create new escrow sell', async () => {
		listingID = await escrowListing
			.connect(creator)
			.sell(assetAddress, 0, parseUnits('100', decimals), 1, price, money.escaddress)
			.then(tx => tx.wait())
			.then(txr => getOfferId(txr))
	})

	it('should create escrow request buy from user', async () => {
		const amount = parseUnits('10', decimals)
		const approveAmount = price.mul(amount)
		await money.connect(user).approve(escrowListing.address, approveAmount)
		await escrowListing.connect(user).requestBuy(listingID, amount, 1, 'childName', 'TEST_CHILD_CID', 0)
	})

	it('should confirm escrow request', async () => {
		const balanceBefore = await payloadAsset.balanceOf(user.address, 1)
		await escrowListing.connect(creator).approveBuy(0)
		const balanceAfter = await payloadAsset.balanceOf(user.address, 1)
		expect(balanceBefore).not.to.be.eq(balanceAfter)
	})
})
