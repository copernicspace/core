import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { create, Create } from './create.fixture'
import { ContractReceipt } from '@ethersproject/contracts'

export interface Parentable extends Create {
	receiver: SignerWithAddress // address who got the child asset
	receiverAmount: BigNumber // amount of child asset transferd to receiver
	childID: BigNumber
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
 * for test suite of this fixture's expected statex
 * @returns blockchain state with result of fixture actions
 */
export const parentable: Fixture<Parentable> = async () => {
	const { deployer, cargoFactory, creator, cargoContract, totalSupply, decimals } = await waffle.loadFixture(create)
	const [, , receiver]: SignerWithAddress[] = await ethers.getSigners()
	const receiverAmount = parseUnits('500', decimals)
	const childID = await cargoContract
		.connect(creator)
		.createChild(receiverAmount)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	// todo `childID` is undefined if tests run with `hh test`
	// works ok if run with `hh test test/asset/cargo/parentable.test.ts`
	await cargoContract.connect(creator).send(receiver.address, childID, receiverAmount)

	return {
		deployer,
		cargoFactory,
		creator,
		cargoContract,
		totalSupply,
		decimals,
		receiver,
		receiverAmount,
		childID
	}
}
