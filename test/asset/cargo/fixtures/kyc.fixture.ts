import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Fixture } from 'ethereum-waffle'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { getAssetID } from '../../../helpers/getAssetId.helper'
import { loadFixture } from './fixtureLoader'
import { parentable, Parentable } from './parentable.fixture'

export interface KYC extends Parentable {
	kycUserA: SignerWithAddress
	kycUserB: SignerWithAddress
	assetID: BigNumber
}

export const kyc: Fixture<KYC> = async () => {
	const parentableFixture = await loadFixture(parentable)
	const [, , , kycUserA, kycUserB]: SignerWithAddress[] = await ethers.getSigners()

	// add both users to kyc list
	const deployer = parentableFixture.deployer
	await parentableFixture.kycContract.connect(deployer).setKycStatus(kycUserA.address, true)
	await parentableFixture.kycContract.connect(deployer).setKycStatus(kycUserB.address, true)

	// add cargo balance to kycUserA
	const creator = parentableFixture.creator
	const assetID = await parentableFixture.cargoContract
		.connect(creator)
		.createChild('1420', '0', 'childForKycTest', kycUserA.address)
		.then(tx => tx.wait())
		.then(txr => getAssetID(txr))

	return {
		...parentableFixture,
		kycUserA,
		kycUserB,
		assetID
	}
}
