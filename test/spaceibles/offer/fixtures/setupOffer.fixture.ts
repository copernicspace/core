import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'

import { SpaceibleAsset } from '../../../../typechain/SpaceibleAsset'
import { SpaceibleOffer, ERC20Mock } from '../../../../typechain'
import contractNames from '../../../../constants/contract.names'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { getOfferId } from '../../../helpers/getOfferId.helper'
import { deploySpaceibleOffer } from './deploy.fixture'

export interface _setupSpaceibleOffer {
	asset: any
	offer: any
	spaceibleAsset: SpaceibleAsset
	spaceibleOffer: SpaceibleOffer
	money: ERC20Mock
	deployer: SignerWithAddress
	seller: SignerWithAddress
}

export const setupSpaceibleOffer: Fixture<_setupSpaceibleOffer> = async () => {
	// create custom fixture loader
	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

	// deploy offer
	const { deployer, spaceibleAsset, spaceibleOffer } = await loadFixture(deploySpaceibleOffer)

	// get signers for offer
	const [, seller] = await ethers.getSigners()

	// setup ERC20 money
	const name = 'MockToken'
	const symbol = 'MT'
	const decimals = 18

	const money = await ethers
		.getContractFactory(contractNames.ERC20_MOCK)
		.then(factory => factory.deploy(name, symbol, decimals))
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	const moneyDecimals = await money.decimals()

	// test asset struct
	const asset = {
		id: undefined, // initialize after mint tx
		cid: 'test-buy-tx',
		balance: 100,
		royalties: 0,
		data: '0x'
	}

	// grant creator role to deployer
	await spaceibleAsset.connect(deployer).grantCreatorRole(seller.address)

	// mint asset & get id
	await spaceibleAsset
		.connect(seller)
		.mint(asset.cid, asset.balance, asset.royalties, asset.data)
		.then(tx => tx.wait())
		.then(txr => (asset.id = getAssetID(txr)))

	// test offer struct
	const offer = {
		id: undefined, // initialize after sell tx
		amount: asset.balance * 0.5, // sell 50% of balance
		price: parseUnits('100', moneyDecimals)
	}

	await spaceibleAsset.connect(seller).setApprovalForAll(spaceibleOffer.address, true)

	// create new offer
	await spaceibleOffer
		.connect(seller)
		.sell(asset.id, offer.amount, offer.price, money.address)
		.then(tx => tx.wait())
		.then(txr => (offer.id = getOfferId(txr)))

	return { asset, offer, spaceibleAsset, spaceibleOffer, money, deployer, seller }
}
