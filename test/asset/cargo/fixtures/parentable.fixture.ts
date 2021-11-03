import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { deploy, Deploy } from './deploy.fixture'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'

export interface Parentable extends Deploy {
	creator: SignerWithAddress // address who creates the root asset
	creatorAmount: BigNumber // amount of root asset created by $creator
	receiver: SignerWithAddress // address who got the child asset
	receiverAmount: BigNumber // amount of child asset transferd to receiver
	rootID: BigNumber
	childID: BigNumber
}
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
	const { deployer, cargoContract } = await waffle.loadFixture(deploy)
	const [, creator, receiver]: SignerWithAddress[] = await ethers.getSigners()
	const cargoContractDecimals = await cargoContract.decimals()
	const creatorAmount = parseUnits('3500', cargoContractDecimals)
	const receiverAmount = parseUnits('500', cargoContractDecimals)

	// create root asset from creator and get id of new asset
	const rootID = await cargoContract
		.connect(creator)
		.create(creatorAmount)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))


		
	// create child to receiver
	const childID = await cargoContract
		.connect(creator)
		.createChild(rootID, receiverAmount)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	// send to receiver
	console.log('rootID:\t' + rootID.toString())
	console.log('childID:\t' + childID.toString())
	await cargoContract
		.connect(creator)
		.send(receiver.address, childID, receiverAmount)

	return {
		deployer,
		cargoContract,
		creator,
		creatorAmount,
		receiver,
		receiverAmount,
		rootID,
		childID
	}
}
