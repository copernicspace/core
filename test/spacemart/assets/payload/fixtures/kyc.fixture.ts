import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ethers, waffle } from 'hardhat'
import { getAssetID } from '../../../../helpers/getAssetId.helper'
import { parentable, Parentable } from './parentable.fixture'

export interface KYC extends Parentable {
	kycUserA: SignerWithAddress
	kycUserB: SignerWithAddress
	assetID: BigNumber
}

export const kyc: Fixture<KYC> = async () => {
	const fixtureLoader = waffle.createFixtureLoader()
	const parentableFixture = await fixtureLoader(parentable)
	const [, , , kycUserA, kycUserB]: SignerWithAddress[] = await ethers.getSigners()

	// add both users to kyc list
	const deployer = parentableFixture.deployer
	await parentableFixture.kycContract.connect(deployer).setKycStatus(kycUserA.address, true)
	await parentableFixture.kycContract.connect(deployer).setKycStatus(kycUserB.address, true)

	// add payload balance to kycUserA
	const creator = parentableFixture.creator
	const amount = parseUnits('1420', 18)

	const assetID = await parentableFixture.payloadAsset
		.connect(creator)
		.createChild(amount, amount, '0', 'childForKycTest', kycUserA.address, 'TEST_CHILD_CID', 0)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return {
		...parentableFixture,
		kycUserA,
		kycUserB,
		assetID
	}
}
