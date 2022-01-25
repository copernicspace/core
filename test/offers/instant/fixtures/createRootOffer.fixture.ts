import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { CargoAsset, ERC20Mock, InstantOffer, KycRegister } from '../../../../typechain'
import contract_names from '../../../../constants/contract.names'
import { loadFixture } from '../../../asset/cargo/fixtures/fixtureLoader'
import { BigNumber } from 'ethers'
import { deployInstantOffer } from './deployInstantOffer.fixture'
import { getOfferSellID } from '../../../helpers/getOfferId.helper'
import { parseUnits } from 'ethers/lib/utils'

export interface CreateRootOffer {
	deployer: SignerWithAddress
	creator: SignerWithAddress
	instantOffer: InstantOffer
	cargoContract: CargoAsset
	kycContract: KycRegister
	totalSupply: BigNumber
	money: ERC20Mock
	sellID: BigNumber
}

export const createRootOffer: Fixture<CreateRootOffer> = async () => {
	const { deployer, creator, instantOffer, cargoContract, kycContract, totalSupply } = await loadFixture(
		deployInstantOffer
	)

	const rootId = 0
	const price = parseUnits('4250', 18)

	// deploy ERC20 mock money
	const money = await ethers
		.getContractFactory(contract_names.ERC20_MOCK)
		.then(factory => factory.deploy())
		.then(contract => contract.deployed())
		.then(deployedContract => deployedContract as ERC20Mock)

	// create new offer
	await cargoContract.connect(creator).setApprovalForAll(instantOffer.address, true)

	// create an offer
	const txr = await instantOffer
		.connect(creator)
		.sell(cargoContract.address, rootId, totalSupply, price, money.address)
		.then(tx => tx.wait())
	const sellID = getOfferSellID(txr)

	return { deployer, creator, instantOffer, cargoContract, kycContract, totalSupply, money, sellID }
}
