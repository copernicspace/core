import { ethers, waffle } from 'hardhat'
import { Fixture } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseUnits } from 'ethers/lib/utils'
import { Asset } from '../../../typechain'
import { BigNumber, ContractReceipt } from 'ethers'
import { expect } from 'chai'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { getAssetID } from '../../helpers/new-asset-id.helper'

interface DivisibilityFixture {
    assetContract: Asset;
    deployer: SignerWithAddress;
}

interface DivisibilityFixtureWithWeight {
    assetContract: Asset;
    deployer: SignerWithAddress;
    rootUser: SignerWithAddress;
    rootID: BigNumber;
}

export const divisibilityFixture: Fixture<DivisibilityFixture> = async function ():
    Promise<DivisibilityFixture> {

        let assetContract: Asset
        let deployer: SignerWithAddress
        before('init signers', async () =>
		    [deployer] = await ethers.getSigners())

        before('deploy asset contract', async () =>
            assetContract = await ethers
                .getContractFactory('Asset')
                .then((factory) => factory.connect(deployer).deploy('TEST-URI'))
                .then((contract) => contract.deployed())
                .then((deployedContract) => deployedContract as Asset))

        it('deployed the asset contract successfully', async () =>
            await assetContract.deployTransaction
                .wait()
                .then((txr) =>
                    expect(txr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS)
                ))

        

        return {assetContract, deployer}
    }

export const divisibilityFixtureWithWeight: Fixture<DivisibilityFixtureWithWeight> = async function ():
    Promise<DivisibilityFixtureWithWeight> {

        const {
            assetContract,
            deployer
        } = await waffle.loadFixture(divisibilityFixture)

        let rootUser: SignerWithAddress

        before('init signers', async () =>
		    [rootUser] = await ethers.getSigners())

        let rootAssetTxr: ContractReceipt
        // create a divisible token with weight 5000
        before('create root asset and get ID of new token', async () =>
            rootAssetTxr = await assetContract
                .connect(rootUser)
                .createRoot(true, true, 100)
                .then((tx) => tx.wait()))

        // check if created successfully
        it('created Root Asset successfully', async () =>
            expect(rootAssetTxr.status).to.be.eq(TX_RECEIPT_STATUS.SUCCESS))

        let rootID: BigNumber
        // extract root asset id for further tests
        before('extract new root asset ID from tx receipt event',
            async () => rootID = getAssetID(rootAssetTxr))

        // check if the root asset ID is correct
        it('has correct new root asset ID', async () =>
            expect(rootID).to.be.equal('1'))

        // check if the root asset has correct weight
        it('has correct weight', async () =>
            expect(await assetContract.getWeight(rootID)).to.be.eq('5000')) 

	    return {assetContract, deployer, rootUser, rootID}
    }
