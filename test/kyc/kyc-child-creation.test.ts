import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset, CargoFactory, KycRegister } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import * as std_ops from '../helpers/standardOperations'

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
		await expect(std_ops.create.from(creator).child(0, 'child name', parseUnits('500', cargoContractDecimals))).to
			.not.be.reverted
	})

	/**
	 * 		3.
	 * 		Check if reverts if trying to create a child asset
	 * 		from a non-KYC allowed account
	 */

	it('reverts child asset creation if not KYC permitted', async () => {
		// take away creator's KYC permissions
		await std_ops.kyc.from(deployer).remove(creator)

		await expect(
			std_ops.create.from(creator).child(0, 'child name', parseUnits('500', cargoContractDecimals))
		).to.be.revertedWith('user not on KYC list')

		// re-add creator's KYC permissions
		await std_ops.kyc.from(deployer).add(creator)
	})

	/**
	 * 		4.
	 * 		Check if can create child based on other root with same KYC
	 */

	let cargoContractA
	before('create new root cargo contract [with starting KYC]', async () => {
		cargoContractA = await std_ops.create
			.from(creator)
			.root('second.test.uri.com', 'Second rootSpaceCargo', parseUnits('2000', cargoContractDecimals))
	})

	it('allows creating new child asset [on new root] if KYC permitted', async () => {
		await expect(
			std_ops.create
				.from(creator)
				.onContract(cargoContractA)
				.child(0, 'child name', parseUnits('500', cargoContractDecimals))
		).to.not.be.reverted
	})
})
