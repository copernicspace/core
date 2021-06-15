const { accounts, contract } = require("@openzeppelin/test-environment");
const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const [owner, buyer] = accounts;
const Asset = contract.fromArtifact("AssetParentable");
const Market = contract.fromArtifact("Market");

describe("deploy market test", function () {
	beforeEach(async function () {
		this.asset = await Asset.new("test/uri");
		this.market = await Market.new(this.asset.address);
	});
	it("correct asset address set", async function () {
		expect(await this.market.asset()).to.be.equal(this.asset.address);
	});
});
