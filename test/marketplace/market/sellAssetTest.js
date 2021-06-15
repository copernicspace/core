const { accounts, contract } = require('@openzeppelin/test-environment')
const { BN, expectEvent } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')
const { getAssetId } = require('../../helpers/new-asset-id.helper')
const { getSellId } = require('../../helpers/sell-id.helper')

const Asset = contract.fromArtifact('AssetParentable') // Loads a compiled contract
const ERC20Mock = contract.fromArtifact('ERC20Mock')
const Market = contract.fromArtifact('Market')

const [owner, buyer] = accounts
const sellPrice = new BN(1000000)

describe('Sell root asset test', function () {

	//todo refactor this test to small steps with desc
	before(async () => {
		this.asset = await Asset.new('test/uri')
		this.market = await Market.new(this.asset.address)
		let txr = await this.asset.createRoot(false, { from: owner })
		this.assetId = getAssetId(txr)
		await this.asset.setApprovalForAll(this.market.address, true, { from: owner })
		this.money = await ERC20Mock.new()
		await this.money.transfer(buyer, sellPrice)

		this.sellTxr = await this.market.sell(
			this.assetId,
			sellPrice,
			this.money.address,
			{ from: owner }
		)
	})
/////
	it('correct event after sell transaction', async () => {
		expectEvent(this.sellTxr, 'NewSmartOffer', {
			seller: owner,
			what: this.assetId,
			price: sellPrice,
			money: this.money.address,
			sellID: new BN(0)
		})
	})

	it('correct balance of seller after smart offer created', async () => {
		// balance is not changed -- the escrow is used via allowance
		expect(await this.asset.balanceOf(owner, this.assetId))
			.to.be.bignumber.equal(new BN(1))
	})

	it('new smart offer is added to storage', async () => {
		const result = await this.market.getSmartOffer('0')
		expect(result).to.have.property('seller', owner)
		expect(result.what).to.be.bignumber.equal(this.assetId)
		expect(result.price).to.be.bignumber.equal(sellPrice)
		expect(result).to.have.property('money', this.money.address)
		expect(result.sellID).to.be.bignumber.equal(new BN(0))
	})

	it('successful buy transaction', async () => {
		//todo refactor approve in dedicated stmt
		let approveTrx = await this.money.approve(
			this.market.address,
			sellPrice,
			{ from: buyer }
		)
		expectEvent(approveTrx, 'Approval', {
			owner: buyer,
			spender: this.market.address,
			value: sellPrice
		})

		let buyTxr = await this.market.buy('0', { from: buyer })
		expectEvent(buyTxr, 'CloseSmartOffer', {
			buyer: buyer,
			sellID: '0'
		})

		this.sellId_ = getSellId(buyTxr)
		expect(this.sellId_).to.be.bignumber.equal('0')

		expect(
			await this.asset.balanceOf(owner, this.assetId)
		).to.be.bignumber.equal('0')
		expect(
			await this.asset.balanceOf(buyer, this.assetId)
		).to.be.bignumber.equal('1')
	})
})
