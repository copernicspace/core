import { ethers } from 'hardhat'
import { expect } from 'chai'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

describe('[utils/erc20-percentage.test.ts]', () => {
	let percentage
	const decimals = 18
	before(
		'deploy percentage test',
		async () =>
			(percentage = await ethers
				.getContractFactory('ERC20PercentageTest')
				.then(factory => factory.deploy())
				.then(contract => contract.deployed()))
	)

	it('has correct result for 0% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.0')
	})

	it('has correct result for 100% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('100', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('100.0')
	})

	it('has correct result for 1% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('1', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('1.0')
	})

	it('has correct result for 0.1% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.1', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.1')
	})

	it('has correct result for 0.01% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.01', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.01')
	})

	it('has correct result for 0.001% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.001', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.001')
	})

	it('has correct result for 0.0001% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.0001', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.0001')
	})

	it('has correct result for 1e-16% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.0000000000000001', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.0000000000000001')
	})

	// todo
	// hope is: there will be NO such low fraction of an erc20 token
	it.skip('has correct result for 1e-decimals% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('0.000000000000000001', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('0.000000000000000001')
	})

	it('has correct result for 50% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('50', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('50.0')
	})

	it('has correct result for 50.5% from 100', async () => {
		const amount = parseUnits('100', decimals)
		const percent = parseUnits('50.5', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)

		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('50.5')
	})

	it('has correct result for 5% from 500000', async () => {
		const amount = parseUnits('50000', decimals)
		const percent = parseUnits('5', decimals)
		const actual = await percentage.testTake(amount, percent, decimals)
		const actualDecimal = formatUnits(actual, decimals)
		expect(actualDecimal).to.be.eq('2500.0')
	})
})
