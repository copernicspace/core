const { accounts, contract } = require('@openzeppelin/test-environment')
const { BN, expectEvent } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')
const { getSellId } = require('../../helpers/sell-id.helper')

const [owner, buyer] = accounts
const Asset = contract.fromArtifact('AssetParentable') // Loads a compiled contract
const ERC20Mock = contract.fromArtifact('ERC20Mock')
const Market = contract.fromArtifact('Market')

const assetId = new BN(1)
const sellPrice = new BN(1000000)

describe('Buy asset test', function () {
	before(async  () => {
		this.asset = await Asset.new('test/uri')
		this.market = await Market.new(this.asset.address)
		this.asset.createRoot(false, { from: owner })
		this.money = await ERC20Mock.new()
		this.money.transfer(buyer, sellPrice)
		await this.asset.setApprovalForAll(this.market.address, true, { from: owner })
		this.sellTxr = await this.market.sell(
			assetId,
			sellPrice,
			this.money.address,
			{ from: owner }
		)
		this.sellID = getSellId(this.sellTxr)

		let approveTrx = await this.money.approve(
			this.market.address,
			sellPrice,
			{ from: buyer }
		)

		this.buyTxr = await this.market.buy(this.sellID, {
			from: buyer
		})
	})

	it('Buyer has correct balance after `buy`', async () => {
		expect(await this.asset.balanceOf(buyer, assetId)).to.be.bignumber.equal('1')
	})
})
