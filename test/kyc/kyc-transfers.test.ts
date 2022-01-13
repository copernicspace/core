import { waffle } from 'hardhat'
import { expect } from 'chai'
import { CargoAsset } from '../../typechain'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parentable } from '../asset/cargo/fixtures/parentable.fixture'
import { parseUnits } from 'ethers/lib/utils'

/**
 * Test suite for checking KycRegister permission change process
 */
describe('SpaceCargoAsset: KYC revert on transfer testing', () => {
	let userA, creator: SignerWithAddress
	before('load userA as signerWithAddress', async () => ([, , , userA] = await ethers.getSigners()))

	let cargoContract: CargoAsset
	let deployer: SignerWithAddress
	let decimals: number

	before(
		'load fixtures/deploy`',
		async () => ({ cargoContract, creator, deployer, decimals } = await waffle.loadFixture(parentable))
	)

	it('disallows sending balance to non-KYC users', async () =>
		await expect(
			cargoContract.connect(deployer).send(userA.address, 0, parseUnits('100', decimals))
		).to.be.revertedWith('user not on KYC list'))

	it('disallows sending balance from non-KYC users', async () =>
		await expect(
			cargoContract.connect(userA).send(creator.address, 0, parseUnits('100', decimals))
		).to.be.revertedWith('user not on KYC list'))
})
