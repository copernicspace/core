import { BigNumber, ContractReceipt, ContractTransaction } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { SpaceibleAsset } from '../../../typechain'

let deployer: SignerWithAddress
let spaceibleAsset: SpaceibleAsset
let baseURI: string

let user: SignerWithAddress

let mintTx: ContractTransaction
let mintTxr: ContractReceipt
let newAssetId: BigNumber

describe('[spaceibles/asset/mint]', () => {
	before('load `user` signer', async () => ([, user] = await ethers.getSigners()))

	describe('mint single from deployer', async () => {
		before(
			'load fixture/deploy',
			async () => ({ deployer, spaceibleAsset, baseURI } = await waffle.loadFixture(deploySpaceibleAsset))
		)

		const mintCID = 'mockCID-deployer-0x123abc'
		const mintBalance = 1
		const mintData = '0x'
		const royalties = 0

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(deployer).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from transaction receipt', () => (newAssetId = getAssetID(mintTxr)))

		it('should have `success` status on mint txr, from: deployer', () =>
			expect(mintTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

		it('should have correct balance after mint', async () =>
			expect(await spaceibleAsset.balanceOf(deployer.address, newAssetId)).to.be.eq(mintBalance))

		it('should have correct `TransferSingle` event', async () =>
			await expect(mintTx)
				.to.emit(spaceibleAsset, 'TransferSingle')
				.withArgs(deployer.address, ethers.constants.AddressZero, deployer.address, newAssetId, mintBalance))

		it('should have correct `URI` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'URI').withArgs(baseURI.concat(mintCID), newAssetId))

		it('should have correct `Royalties` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'Royalties').withArgs(newAssetId, royalties))
	})

	describe('mint single from not deployer', async () => {
		before(
			'load fixture/deploy',
			async () => ({ spaceibleAsset, baseURI } = await waffle.loadFixture(deploySpaceibleAsset))
		)

		const mintCID = 'mockCID-not-deployer-0x123abc'
		const mintBalance = 1
		const royalties = 0
		const mintData = '0x'

		before(
			'grant creator role to user',
			async () => await spaceibleAsset.connect(deployer).grantCreatorRole(user.address)
		)

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(user).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from transaction receipt', () => (newAssetId = getAssetID(mintTxr)))

		it('should have `success` status on mint txr, from: user', async () =>
			expect(mintTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

		it('should have correct balance after mint', async () =>
			expect(await spaceibleAsset.balanceOf(user.address, newAssetId)).to.be.eq(mintBalance))

		it('should have correct `TransferSingle` event', async () =>
			await expect(mintTx)
				.to.emit(spaceibleAsset, 'TransferSingle')
				.withArgs(user.address, ethers.constants.AddressZero, user.address, newAssetId, mintBalance))

		it('should have correct `URI` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'URI').withArgs(baseURI.concat(mintCID), newAssetId))

		it('should have correct `Royalties` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'Royalties').withArgs(newAssetId, royalties))
	})

	describe('mint multiple from deployer', async () => {
		before(
			'load fixture/deploy',
			async () => ({ deployer, spaceibleAsset, baseURI } = await waffle.loadFixture(deploySpaceibleAsset))
		)

		const mintCID = 'mockCID-deployer-0x123abc'
		const mintBalance = 142
		const mintData = '0x'
		const royalties = 5

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(deployer).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from transaction receipt', () => (newAssetId = getAssetID(mintTxr)))

		it('should have `success` status on mint txr, from: deployer', () =>
			expect(mintTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

		it('should have correct balance after mint', async () =>
			expect(await spaceibleAsset.balanceOf(deployer.address, newAssetId)).to.be.eq(mintBalance))

		it('should have correct `TransferSingle` event', async () =>
			await expect(mintTx)
				.to.emit(spaceibleAsset, 'TransferSingle')
				.withArgs(deployer.address, ethers.constants.AddressZero, deployer.address, newAssetId, mintBalance))

		it('should have correct `URI` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'URI').withArgs(baseURI.concat(mintCID), newAssetId))

		it('should have correct `Royalties` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'Royalties').withArgs(newAssetId, royalties))
	})

	describe('mint multiple from not deployer', async () => {
		before(
			'load fixture/deploy',
			async () => ({ spaceibleAsset, baseURI } = await waffle.loadFixture(deploySpaceibleAsset))
		)

		const mintCID = 'mockCID-not-deployer-0x123abc'
		const mintBalance = 142
		const royalties = 42
		const mintData = '0x'

		before(
			'grant creator role to user',
			async () => await spaceibleAsset.connect(deployer).grantCreatorRole(user.address)
		)

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(user).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from transaction receipt', () => (newAssetId = getAssetID(mintTxr)))

		it('should have `success` status on mint txr, from: `user`', async () =>
			expect(mintTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

		it('should have correct balance after mint', async () =>
			expect(await spaceibleAsset.balanceOf(user.address, newAssetId)).to.be.eq(mintBalance))

		it('should have correct `TransferSingle` event', async () =>
			await expect(mintTx)
				.to.emit(spaceibleAsset, 'TransferSingle')
				.withArgs(user.address, ethers.constants.AddressZero, user.address, newAssetId, mintBalance))

		it('should have correct `URI` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'URI').withArgs(baseURI.concat(mintCID), newAssetId))

		it('should have correct `Royalties` event', async () =>
			await expect(mintTx).to.emit(spaceibleAsset, 'Royalties').withArgs(newAssetId, royalties))
	})
})
