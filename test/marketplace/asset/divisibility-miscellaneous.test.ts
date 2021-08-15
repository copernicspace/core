import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { Asset } from '../../../typechain'
import { divisibilityFixtureWithWeight } from './divisibility.fixture'

describe('[divisibility-miscellaneous.test.ts]', () => {
	let assetContract: Asset
	let deployer: SignerWithAddress, rootUser: SignerWithAddress, _placeholderUser: SignerWithAddress
	let rootID: BigNumber
	before(
		'load divisibility deploy fixture',
		async () =>
			({ assetContract, deployer, rootUser, rootID } = await waffle.loadFixture(divisibilityFixtureWithWeight))
	)

	let nonRootUser: SignerWithAddress
	before('init signers', async () => ([_placeholderUser, nonRootUser] = await ethers.getSigners()))

	let mintedIDs: BigNumber[]
	it('has correct new root asset ID', async () => expect(rootID).to.be.equal('1'))

    // toggling divisibility
	it('allows to toggle divisibility by asset owner', async () => {
		expect(await assetContract.isDivisible(rootID)).to.be.true
		await assetContract.connect(rootUser).makeNotDivisible(rootID)
		expect(await assetContract.isDivisible(rootID)).to.be.false
	})

	it('disallows non-asset-owners to toggle divisibility', async () =>
		await expect(assetContract.connect(nonRootUser).makeDivisible(rootID)).to.be.revertedWith('Not owner'))

	it('disallows assets with division set to false to be divided', async () =>
		await expect(assetContract.connect(rootUser).divideInto(rootID, 10, 5)).to.be.revertedWith(
			'Asset has divisibility disabled'
		))

    // setting minimal step size
    it('correctly sets minimal step size', async() => {
        await assetContract.connect(rootUser).setMinStepSize(rootID, 100)
        expect(await assetContract.getMinStepSize(rootID)).to.be.eq('100')
    })

    it('disallows non-owners from setting minimal step size', async() => {
        await expect(assetContract.connect(nonRootUser).setMinStepSize(rootID, 100)).to.be.revertedWith('Not owner')
    })

    it('restricts division to be a multiple of step size', async() => {
		await assetContract.connect(rootUser).makeDivisible(rootID)
        await expect(assetContract.connect(rootUser).divideInto(rootID, 3, 350)).to.be.revertedWith('Required step size is not a viable multiple of minimal step size')
    })

	it('ensures that asset cannot be divided into tokens of weight or num 0', async() => {
		await expect(assetContract.connect(rootUser).batchDivideInto(rootID, ['0', '5'], ['100', '200']))
			.to.be.revertedWith('Step number must be positive (non-zero)')
		await expect(assetContract.connect(rootUser).batchDivideInto(rootID, ['5', '10'], ['0', '200']))
		.to.be.revertedWith('Step size must be positive (non-zero)')
	})
})
