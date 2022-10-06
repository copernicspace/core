import { expect } from 'chai'
import { PayloadAsset, PayloadFactory, KycRegister } from '../../typechain'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { parentable } from '../spacemart/assets/payload/fixtures/parentable.fixture'
import contractNames from '../../constants/contract.names'
import { getPayloadAddress } from '../helpers/payloadAddress'

describe.skip('[kyc/kyc-child-creation] Child creation & integration with KYC', () => {
	let creator: SignerWithAddress
	let payloadFactory: PayloadFactory
	let payloadAsset: PayloadAsset
	let kycContract: KycRegister
	let deployer: SignerWithAddress
	let payloadAssetDecimals: BigNumber

	const testCID = 'TEST_CID_KYC_CHILD_CREATION'

	before(
		'load fixtures/parentable',
		async () =>
			({ payloadAsset, payloadFactory, creator, kycContract, deployer } = await waffle.loadFixture(parentable))
	)

	before('get decimals', async () => {
		payloadAssetDecimals = await payloadAsset.decimals()
	})

	/**
	 *      2.
	 *      Check if can create a new child asset
	 */

	it('allows creating new child asset if KYC permitted', async () => {
		await expect(
			payloadAsset
				.connect(creator)
				.createChild(parseUnits('500', payloadAssetDecimals), 0, 'child name', creator.address, testCID, 0)
		).to.not.be.reverted
	})

	/**
	 * 		3.
	 * 		Check if reverts if trying to create a child asset
	 * 		from a non-KYC allowed account
	 */

	it('reverts child asset creation if not KYC permitted', async () => {
		// take away creator's KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, false)

		await expect(
			payloadAsset
				.connect(creator)
				.createChild(parseUnits('500', payloadAssetDecimals), 0, 'child name', creator.address, testCID, 0)
		).to.be.revertedWith('sender/seller is not on KYC list')

		// re-add creator's KYC permissions
		await kycContract.connect(deployer).setKycStatus(creator.address, true)
	})

	/**
	 * 		4.
	 * 		Check if can create child based on other root with same KYC
	 */

	let payloadAssetAaddress
	let payloadAssetA: PayloadAsset
	before('create new root payload contract [with starting KYC]', async () => {
		payloadAssetAaddress = await payloadFactory
			.connect(creator)
			.create(
				'second.test.uri.com',
				'Second rootSpacePayload',
				payloadAssetDecimals,
				parseUnits('2000', payloadAssetDecimals),
				kycContract.address,
				0,
				false,
				'TEST_CID'
			)
			.then(tx => tx.wait())
			.then(txr => getPayloadAddress(txr))

		payloadAssetA = await ethers
			.getContractAt(contractNames.PAYLOAD_ASSET, payloadAssetAaddress)
			.then(contract => contract as PayloadAsset)
	})

	it('allows creating new child asset [on new root] if KYC permitted', async () => {
		await expect(
			payloadAssetA
				.connect(creator)
				.createChild(parseUnits('500', payloadAssetDecimals), 0, 'child name', creator.address, testCID, 0)
		).to.not.be.reverted
	})
})
