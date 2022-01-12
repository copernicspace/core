import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import { TX_RECEIPT_STATUS } from '../../constants/tx-receipt-status'
import contractNames from '../../constants/contract.names'
import { getCargoAddress } from '../helpers/cargoAddress'

describe('SpaceCargoAsset: Child creation & integration with KYC', () => {
	let userA, userB, userC, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA, userB, userC] = await ethers.getSigners()))

	let cargoFactory: CargoFactory
	let cargoContract: CargoAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let cargoContractDecimals: BigNumber

	before(
		'load fixtures/parentable',
		async () =>
			({ cargoFactory, cargoContract, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		cargoContractDecimals = await cargoContract.decimals()
	})

	/**
	 *      2.
	 *      Check if can create a new child asset
	 */

	it('allows creating new child asset if KYC permitted', async () => {
		await expect(
			cargoContract
				.connect(creator)
				.createChild(parseUnits('500', cargoContractDecimals), 0, 'child name', creator.address)
		).to.not.be.reverted
	})

	/**
	 * 		3.
	 * 		Check if reverts if trying to create a child asset
	 * 		from a non-KYC allowed account
	 */

	it('reverts child asset creation if not KYC permitted', async () => {
		// take away creator's KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)
		// await std_ops.kyc.from(deployer).remove(creator)

		await expect(
			cargoContract
				.connect(creator)
				.createChild(parseUnits('500', cargoContractDecimals), 0, 'child name', creator.address)
		).to.be.revertedWith('user not on KYC list')

		// re-add creator's KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)
	})

	/**
	 * 		4.
	 * 		Check if can create child based on other root with same KYC
	 */

	let cargoContractAaddress
	let cargoContractA: CargoAsset
	before('create new root cargo contract [with starting KYC]', async () => {
		cargoContractAaddress = await cargoFactory
			.connect(creator)
			.createCargo(
				'second.test.uri.com',
				'Second rootSpaceCargo',
				cargoContractDecimals,
				parseUnits('2000', cargoContractDecimals),
				kycContract.address
			)
			.then(tx => tx.wait())
			.then(txr => getCargoAddress(txr))

		cargoContractA = await ethers
			.getContractAt(contractNames.CARGO_ASSET, cargoContractAaddress)
			.then(contract => contract as CargoAsset)
	})

	it('allows creating new child asset [on new root] if KYC permitted', async () => {
		await expect(
			cargoContractA
				.connect(creator)
				.createChild(parseUnits('500', cargoContractDecimals), 0, 'child name', creator.address)
		).to.not.be.reverted
	})
})
