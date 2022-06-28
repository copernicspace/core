import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { waffle } from 'hardhat'
import { TX_RECEIPT_STATUS } from '../../../constants/tx-receipt-status'
import { ERC20Mock, SpaceibleAsset, SpaceibleOffer } from '../../../typechain'
import { setupSpaceibleOffer } from './fixtures/setupOffer.fixture'

const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()

describe('[spaceibles/setupOffer] setupOffer fixture test suite', () => {
    let asset, offer: any
    let spaceibleAsset: SpaceibleAsset
    let spaceibleOffer: SpaceibleOffer
    let money: ERC20Mock
    let deployer, seller: SignerWithAddress
    let moneyDecimals: BigNumber
    let offerFetched: any

    before(
		'load offer/fixtures/setupOffer',
		async () => ({ 
			asset, 
			offer, 
			spaceibleAsset, 
			spaceibleOffer,
			money,
			deployer,
			seller
		} = await loadFixture(setupSpaceibleOffer))
	)

    before('fetch offer', async () => {
        offerFetched = await spaceibleOffer.getOffer(offer.id)
    })

    it('should have `success` status on `SetupSpaceibleOffer` fixture tx receipt', async () =>
		expect(await spaceibleOffer.deployTransaction.wait().then(txr => txr.status)).to.be.eq(
			TX_RECEIPT_STATUS.SUCCESS
    ))

    describe('has correct asset parameters', async () => {
        // asset struct values:

        // it('has correct id', async () => {
        //     const actual = await asset.id
		//     const expected = 1
        //     expect(expected).to.be.eq(actual)
        // })
        it('has correct cid', async () => {
            const actual = await asset.cid
		    const expected = 'test-buy-tx'
            expect(expected).to.be.eq(actual)
        })
        it('has correct balance', async () => {
            const actual = await asset.balance
		    const expected = 100
            expect(expected).to.be.eq(actual)
        })
        it('has correct royalties', async () => {
            const actual = await asset.royalties
		    const expected = 0
            expect(expected).to.be.eq(actual)
        })
        it('has correct data', async () => {
            const actual = await asset.data
		    const expected = '0x'
            expect(expected).to.be.eq(actual)
        })
        

        // on-chain values:

        it('minted correct balance', async () => {
            const actual = await spaceibleAsset.balanceOf(seller.address, asset.id)
		    const expected = 100
            expect(expected).to.be.eq(actual)
        })
        it('set correct royalties', async () => {
            const actual = await spaceibleAsset.getRoyalties(asset.id)
		    const expected = 0
            expect(expected).to.be.eq(actual)
        })
    })

    describe('has correct offer parameters', async () => {
        // offer struct values:

        // it('has correct id', async () => {
        //     const actual = await offer.id
		//     const expected = 1
        //     expect(expected).to.be.eq(actual)
        // })
        it('has correct amount', async () => {
            const actual = await offer.amount
		    const expected = 50
            expect(expected).to.be.eq(actual)
        })
        it('has correct price', async () => {
            const actual = await offer.price
		    const expected = parseUnits('100', moneyDecimals)
            expect(expected).to.be.eq(actual)
        })

        // on-chain values:

        it('has correct asset ID', async () => {
            const actual = await offerFetched.assetId
		    const expected = offer.id
            expect(expected).to.be.eq(actual)
        })
        it('has correct amount', async () => {
            const actual = offerFetched.amount
		    const expected = offer.amount
            expect(expected).to.be.eq(actual)
        })
        it('has correct price', async () => {
            const actual = offerFetched.price
		    const expected = offer.price
            expect(expected).to.be.eq(actual)
        })
        it('has correct money address', async () => {
            const actual = offerFetched.money
		    const expected = money.address
            expect(expected).to.be.eq(actual)
        })
    })
})