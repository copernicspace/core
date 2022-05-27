import { ethers, waffle } from 'hardhat'
import { expect } from 'chai'

import { deploySpaceibleOffer } from './fixtures/deploy.fixture'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import contractNames from '../../../constants/contract.names'
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import { deploySpaceibleAsset } from '../asset/fixtures/deploy.fixture'
import { getAssetID } from '../../helpers/getAssetId.helper'
import { getOfferId } from '../../helpers/getOfferId.helper'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/offer/pause]', () => {
	let spaceibleAsset: SpaceibleAsset

	let spaceibleOffer: SpaceibleOffer

	let erc20Mock: ERC20Mock
	let seller: SignerWithAddress, user: SignerWithAddress

	let mintTx: ContractTransaction
	let mintTxr: ContractReceipt

	let sellTx: ContractTransaction
	let sellTxr: ContractReceipt

	describe('`SpaceibleOffer::pause` test suite', () => {
		before('load asset/fixtures/deploy', async () => ({ spaceibleAsset } = await loadFixture(deploySpaceibleAsset)))

		before('load offer/fixtures/deploy', async () => ({ spaceibleOffer } = await loadFixture(deploySpaceibleOffer)))

		before('deploy ERC20 Mock', async () => {
			erc20Mock = await ethers
				.getContractFactory(contractNames.ERC20_MOCK)
				.then(factory => factory.deploy())
				.then(contract => contract.deployed())
				.then(deployedContract => deployedContract as ERC20Mock)
		})
		before('load creator and user', async () => ([, seller, user] = await ethers.getSigners()))

		const asset = {
			id: undefined,
			cid: 'mockCID-deployer-0x123abc',
			balance: 100,
			royalties: 0,
			data: '0x'
		}

		before('mint asset as seller and assign id', async () => {
			mintTx = await spaceibleAsset.connect(seller).mint(asset.cid, asset.balance, asset.royalties, asset.data)
			mintTxr = await mintTx.wait()
		})

		before('assign asset id from mint tx receipt', async () => (asset.id = getAssetID(mintTxr)))

		const offer = {
			id: undefined,
			amount: 100,
			price: 100
		}

		before(
			'approve for all as seller',
			async () => await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)
		)

		before('create new offer', async () => {
			sellTx = await spaceibleOffer
				.connect(seller)
				.sell(spaceibleAsset.address, asset.id, offer.amount, offer.price, erc20Mock.address)

			sellTxr = await sellTx.wait()
		})

		before('assign new sell offer id', async () => (offer.id = getOfferId(sellTxr)))

		it('should revert on `pause` tx if user is not creator of the offer', async () =>
			await expect(spaceibleOffer.connect(user).pause(offer.id)).to.be.revertedWith(
				'Only offer seller can pause'
			))
	})
})
