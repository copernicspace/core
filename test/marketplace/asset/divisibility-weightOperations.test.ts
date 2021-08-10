import { divisibilityFixtureWithWeight } from './divisibility.fixture'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers, waffle } from 'hardhat'
import { BigNumber, ContractReceipt } from 'ethers'
import { Asset } from '../../../typechain'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'

/*
    General test set for weight-oriented operations on divisible tokens
*/


describe('[divisibility-WeightOperations.test.ts]', () => {
	let assetContract: Asset
	let deployer, rootUser: SignerWithAddress
    let rootID: BigNumber

    before('load divisibility deploy fixture', async () => {
        ({
            assetContract,
            deployer,
            rootUser,
            rootID
        } = await waffle.loadFixture(divisibilityFixtureWithWeight))
    })

    let nonRootUser: SignerWithAddress
    before('init signers', async () =>
		[nonRootUser] = await ethers.getSigners())
    
    console.log(assetContract)

    it('can correctly set new weight of asset', async () => {
		await assetContract.connect(rootUser).setWeight(rootID, 200)
		expect(await assetContract.getWeight(rootID)).to.be.eq('200')
	})

	it('disallows non-owners from setting weight of asset', async () => {
		await expect(
			assetContract.connect(nonRootUser).setWeight(rootID, 100))
			.to.be.revertedWith('Not owner')
	})

})