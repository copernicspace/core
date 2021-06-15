const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { getAssetId } = require("../helpers/new-asset-id.helper");
const { getSellId } = require("../helpers/sell-id.helper");

const Asset = contract.fromArtifact("AssetParentable"); // Loads a compiled contract
const ERC20Mock = contract.fromArtifact("ERC20Mock");
const Market = contract.fromArtifact("Market");

const [owner, buyer] = accounts;
const sellPrice = new BN(1000000);

describe("sell id extract test", function () {

	before(async () => {

		this.asset = await Asset.new("test/uri");
        this.market = await Market.new(this.asset.address);

        // creating assets for test sell
        this.txr1 = await this.asset.createRoot(true, { from: owner });
		this.assetId1 = await getAssetId(this.txr1);

        this.txr2 = await this.asset.create(this.assetId1, true, { from: owner })
        this.assetId2 = await getAssetId(this.txr2);

        this.money = await ERC20Mock.new();
		await this.money.transfer(buyer, sellPrice);

		await this.asset.setApprovalForAll(this.market.address, true, { from: owner });

	});

    it("returns the correct expected sell id", async() => {

        // sell asset with id=1, transaction id=0
        this.sellTxr1 = await this.market.sell(
			this.assetId1,
			sellPrice,
			this.money.address,
			{ from: owner }
		);

        this.sellId1 = getSellId(this.sellTxr1);
        expect(this.sellTxr1.receipt.logs[0].args.sellID).to.be.bignumber.equal(new BN(0));
		expect(this.sellId1).to.be.bignumber.equal(new BN(0));


        // sell asset with id=2, transaction id=1
        this.sellTxr2 = await this.market.sell(
			this.assetId2,
			sellPrice,
			this.money.address,
			{ from: owner }
		);

        this.sellId2 = getSellId(this.sellTxr2);
        expect(this.sellTxr2.receipt.logs[0].args.sellID).to.be.bignumber.equal(new BN(1));
		expect(this.sellId2).to.be.bignumber.equal(new BN(1));

    });
    
});
