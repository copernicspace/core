import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleAsset } from './fixtures/deploy.fixture'
import { SpaceibleAsset } from '../../../typechain'
import { BigNumber, ContractReceipt, ContractTransaction } from 'ethers'
import { getAssetID } from '../../helpers/getAssetId.helper'

describe('[spaceibles/asset/transfer]', () => {
	let user: SignerWithAddress, anotherUser: SignerWithAddress
	let spaceibleAsset: SpaceibleAsset
	let mintTx: ContractTransaction
	let mintTxr: ContractReceipt
	let assetId: BigNumber
	let userBalanceBefore: BigNumber, anotherUserBalanceBefore: BigNumber

	before('load `user` and `anotherUser`', async () => ([, user, anotherUser] = await ethers.getSigners()))
	before('load fixtures/deploy', async () => ({ spaceibleAsset } = await waffle.loadFixture(deploySpaceibleAsset)))

	describe('transfer single asset', async () => {
		// mint constants
		const mintCID = 'mockCID-transfer-0x123abc'
		const mintBalance = 1
		const mintData = '0x'
		const royalties = 0
		// transfer constants
		const amount = BigNumber.from(1)
		const data = '0x'

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(user).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from `mint` transaction receipt', () => (assetId = getAssetID(mintTxr)))

		before('safe user balances before transfer tx', async () => {
			userBalanceBefore = await spaceibleAsset.balanceOf(user.address, assetId)
			anotherUserBalanceBefore = await spaceibleAsset.balanceOf(anotherUser.address, assetId)
		})

		before(
			'send `safeTransferFrom` transaction to transfer 1 asset from `user` to `anotherUser` ',
			async () =>
				await spaceibleAsset
					.connect(user)
					.safeTransferFrom(user.address, anotherUser.address, assetId, amount, data)
		)

		it('should have correct `user` balance before transfer tx', async () =>
			expect(userBalanceBefore).to.be.eq(mintBalance))

		it('should have correct `anotherUser` balance before transfer tx', async () =>
			expect(anotherUserBalanceBefore).to.be.eq(0))

		it('should have correct `user` balance after transfer tx', async () => {
			const userBalanceAfter = await spaceibleAsset.balanceOf(user.address, assetId)
			expect(userBalanceAfter).not.to.be.eq(userBalanceBefore)
			expect(userBalanceAfter).to.be.eq(userBalanceBefore.sub(amount))
		})

		it('should have correct `anotherUser` balance after transfer tx', async () => {
			const anotherUserBalanceAfter = await spaceibleAsset.balanceOf(anotherUser.address, assetId)
			expect(anotherUserBalanceAfter).not.to.be.eq(anotherUserBalanceBefore)
			expect(anotherUserBalanceAfter).to.be.eq(anotherUserBalanceBefore.add(amount))
		})
	})

	describe('transfer multiple asset', async () => {
		// mint constants
		const mintCID = 'mockCID-transfer-0x123abc'
		const mintBalance = 1000
		const mintData = '0x'
		const royalties = 5
		// transfer constants
		const amount = BigNumber.from(142)
		const data = '0x'

		before('send `mint` transaction', async () => {
			mintTx = await spaceibleAsset.connect(user).mint(mintCID, mintBalance, royalties, mintData)
			mintTxr = await mintTx.wait()
		})

		before('get new asset id from transaction receipt', () => (assetId = getAssetID(mintTxr)))

		before('safe user balances before transfer tx', async () => {
			userBalanceBefore = await spaceibleAsset.balanceOf(user.address, assetId)
			anotherUserBalanceBefore = await spaceibleAsset.balanceOf(anotherUser.address, assetId)
		})

		before(
			'send `safeTransferFrom` transaction to transfer 1 asset from `user` to `anotherUser` ',
			async () =>
				await spaceibleAsset
					.connect(user)
					.safeTransferFrom(user.address, anotherUser.address, assetId, amount, data)
		)

		it('should have correct `user` balance before transfer tx', async () =>
			expect(userBalanceBefore).to.be.eq(mintBalance))

		it('should have correct `anotherUser` balance before transfer tx', async () =>
			expect(anotherUserBalanceBefore).to.be.eq(0))

		it('should have correct `user` balance after transfer tx', async () => {
			const userBalanceAfter = await spaceibleAsset.balanceOf(user.address, assetId)
			expect(userBalanceAfter).not.to.be.eq(userBalanceBefore)
			expect(userBalanceAfter).to.be.eq(userBalanceBefore.sub(amount))
		})

		it('should have correct `anotherUser` balance after transfer tx', async () => {
			const anotherUserBalanceAfter = await spaceibleAsset.balanceOf(anotherUser.address, assetId)
			expect(anotherUserBalanceAfter).not.to.be.eq(anotherUserBalanceBefore)
			expect(anotherUserBalanceAfter).to.be.eq(anotherUserBalanceBefore.add(amount))
		})
	})
})
