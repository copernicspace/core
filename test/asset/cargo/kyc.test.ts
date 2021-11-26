import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { create } from './fixtures/create.fixture'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { parseUnits } from '@ethersproject/units'

describe('[test/asset/cargo/kyc.test] SpaceCargo asset: kyc test suite', () => {
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	beforeEach(
		'load fixtures/deploy`',
		async () => ({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(create))
	)

	it('disallows creating child if user not on KYC list', async () => {
		const cargoContractDecimals = await cargoContract.decimals()
		const amount = parseUnits('500', cargoContractDecimals)

		// remove KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)

		await expect(
			cargoContract.connect(creator).createChild(amount, 0, 'childSpaceCargoName', creator.address)
		).to.be.revertedWith('not on KYC list')
	})

	it('allows creating child if user on KYC list', async () => {
		// grant KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)

		const cargoContractDecimals = await cargoContract.decimals()
		const amount = parseUnits('500', cargoContractDecimals)

		// create child to receiver
		const childID = await cargoContract
			.connect(creator)
			.createChild(amount, 0, 'childSpaceCargoName', creator.address)
			.then(tx => tx.wait())
			.then(txr => getAssetID(txr))

		expect(childID).to.be.eq(BigNumber.from(1))

		const actual = await cargoContract.balanceOf(creator.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})
})
