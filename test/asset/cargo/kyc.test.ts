import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../../typechain'
import { create } from './fixtures/create.fixture'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { parseUnits } from '@ethersproject/units'
import { parentable } from './fixtures/parentable.fixture'
import contractNames from '../../../constants/contract.names'
import { getCargoAddress } from '../../helpers/cargoAddress'

describe('[test/asset/cargo/kyc.test] SpaceCargo asset: kyc test suite', () => {
	let userA, userB, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , userA, userB] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let kycContractAddress: string
	let deployer: SignerWithAddress
	beforeEach(
		'load fixtures/deploy`',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer, kycContractAddress } =
				await waffle.loadFixture(parentable))
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

		expect(childID).to.be.eq(BigNumber.from(2))

		const actual = await cargoContract.balanceOf(creator.address, childID)
		const expected = amount
		expect(expected).to.be.eq(actual)
	})

	it('disallows creating asset if user not on KYC list', async () => {
		const cargoContractDecimals = await cargoContract.decimals()
		const amount = parseUnits('2000', cargoContractDecimals)
		// add userA to cargoFactory perms
		await cargoFactory.connect(deployer).addClient(userA.address)

		await expect(
			cargoFactory
				.connect(userA)
				.createCargo('userA.cargo.com', 'userA test cargo', cargoContractDecimals, amount, kycContractAddress)
		).to.be.revertedWith('not on KYC list')
	})

	it('allows creating asset if same user is on KYC list', async () => {
		const cargoContractDecimals = await cargoContract.decimals()
		const amount = parseUnits('2000', cargoContractDecimals)
		// add userA to cargoFactory perms
		await cargoFactory.connect(deployer).addClient(userA.address)

		// add KYC permissions to userA
		await kycContract.setKycStatus(userA.address, true)

		const newCargoContractAddress = await cargoFactory
			.connect(creator)
			.createCargo(
				'new-test.uri.com',
				'NEW rootSpaceCargoName',
				cargoContractDecimals,
				amount,
				kycContractAddress
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		const newCargoContract = await ethers
			.getContractAt(contractNames.CARGO_ASSET, newCargoContractAddress)
			.then(contract => contract as CargoAsset)

		it('has correct uri', async () => {
			const actual = await newCargoContract.uri('2')
			const expected = 'new-test.uri.com'
			expect(expected).to.be.eq(actual)
		})

		it('has correct name', async () => {
			const actual = await newCargoContract.getName(0)
			const expected = 'NEW rootSpaceCargoName'
			expect(expected).to.be.eq(actual)
		})

		it('has correct decimals', async () => {
			const actual = await newCargoContract.decimals()
			const expected = BigNumber.from(18)
			expect(expected).to.be.eq(actual)
		})
	})
})
