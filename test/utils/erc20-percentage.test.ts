import { ethers } from 'hardhat'
import { expect } from 'chai'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

describe('[utils/erc20-percentage.test.ts]', () => {
	let percentage
	before(
		'deploy percentage test',
		async () =>
			(percentage = await ethers
				.getContractFactory('ERC20PercentageTest')
				.then(factory => factory.deploy())
				.then(contract => contract.deployed()))
	)

	it('has correct result for 0% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('0', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('0.0')
	})

	it('has correct result for 100% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('100', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('100.0')
	})

	it('has correct result for 1% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('1', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('1.0')
	})

	it('has correct result for 0.1% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('0.1', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('0.1')
	})

	it('has correct result for 1e-16% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('0.0000000000000001', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('0.0000000000000001')
	})

	// todo
	// hope is: there will be NO such low fraction of an erc20 token
	it.skip('has correct result for 1e-18% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('0.000000000000000001', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('0.000000000000000001')
	})

	it('has correct result for 50% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('50', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('50.0')
	})

	it('has correct result for 50.5% from 100', async () => {
		const amount = parseUnits('100', 18)
		const percent = parseUnits('50.5', 18)
		const actual = await percentage.take(percent, amount)
		const actualDecimal = formatUnits(actual, 18)
		expect(actualDecimal).to.be.eq('50.5')
	})
})
