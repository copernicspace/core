import { waffle } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CargoAsset } from '../../../typechain'
import { parentable } from './fixtures/parentable.fixture'
import { BigNumber } from '@ethersproject/bignumber'

/**
 * test suite for {@link parentable}
 */
describe('[test/asset/cargo/parentable.test] SpaceCargo asset: parentable fixture test suite', () => {
	let cargoContract: CargoAsset
	let creator: SignerWithAddress
	let receiver: SignerWithAddress
	let creatorAmount: BigNumber
	let receiverAmount: BigNumber
	let rootID: BigNumber
	let childID: BigNumber
	let deployer: SignerWithAddress

	before(
		'load fixtures/parentable`',
		async () => ({ cargoContract, creator, receiver, receiverAmount } = await waffle.loadFixture(parentable))
	)

	// TODO: fix

	it('correct creator balance after create child and send to receiver', async () => {
		const actual = await cargoContract.balanceOf(creator.address, )
		console.log(actual.toString())
		const expected = creatorAmount.sub(receiverAmount)
		console.log(expected.toString())
		expect(expected).to.be.eq(actual)
	})

	// it('receiver has correct balance of child asset', async () => {
	// 	const actual = await cargoContract.balanceOf(receiver.address, childID)
	// 	const expected = receiverAmount
	// 	expect(expected).to.be.eq(actual)
	// })
})
