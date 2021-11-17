import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { create, Create } from './create.fixture'
import { CargoAsset } from '../../../../typechain'

export interface Parentable extends Create {
	deployer: SignerWithAddress
	cargoContract: CargoAsset
	creator: SignerWithAddress
	receiver: SignerWithAddress // address who got the child asset
	amount: BigNumber // amount of child asset transferd to receiver
	childID: BigNumber
	decimals: number
}
// todo extend parentable fixture setup, make more complex mock struct as result
/**
 * this fixture does:
 * 		* create root asset as `creator` with 3500 balance
 * 		* create child asset as `creator`, with pid as root.id and 500 balance
 * 		* send 500 of child asset from `creator` to `receiver`
 *
 * //todo link below doe not work ;(
 * @see {@link test/asset/cargo/parentable.test.ts}
 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */
export const parentable: Fixture<Parentable> = async () => {
	const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader(
		await (ethers as any).getSigners()
	)
	const { deployer, cargoFactory, creator, cargoContract, totalSupply, decimals } = await loadFixture(create)
	const [, , receiver]: SignerWithAddress[] = await ethers.getSigners()
	const cargoContractDecimals = await cargoContract.decimals()
	const amount = parseUnits('500', cargoContractDecimals)

	// create child to receiver
	const childID = await cargoContract
		.connect(creator)
		.createChild(amount, 0, 'childBrandName', receiver.address)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return {
		deployer,
		cargoContract,
		creator,
		receiver,
		amount,
		childID,
		totalSupply,
		cargoFactory,
		decimals
	}
}
