import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { ethers, waffle } from 'hardhat'
import { getAssetID } from '../../../../helpers/getAssetId.helper'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { createPayloadAsset, Create } from './create.fixture'

export interface Parentable extends Create {
	receiver: SignerWithAddress // address who got the child asset
	amount: BigNumber // amount of child asset transfer to receiver
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
 * @see {@link test/asset/payload/parentable.test.ts}
 * for test suite of this fixture's expected state
 * @returns blockchain state with result of fixture actions
 */
export const parentable: Fixture<Parentable> = async () => {
	const fixtureLoader = waffle.createFixtureLoader()
	const { deployer, payloadFactory, creator, payloadAsset, totalSupply, decimals, kycContract } = await fixtureLoader(
		createPayloadAsset
	)
	const [, , receiver]: SignerWithAddress[] = await ethers.getSigners()
	const payloadContractDecimals = await payloadAsset.decimals()
	const amount = parseUnits('500', payloadContractDecimals)

	await kycContract.connect(deployer).setKycStatus(creator.address, true)
	await kycContract.connect(deployer).setKycStatus(receiver.address, true)

	// create child to receiver
	const childID = await payloadAsset
		.connect(creator)
		.createChild(amount, 0, 'childSpacePayloadName', receiver.address, 'TEST_CHILD_CID')
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return {
		deployer,
		creator,
		payloadFactory,
		kycContract,
		payloadAsset,
		totalSupply,
		decimals,
		receiver,
		amount,
		childID
	}
}
