// SPDX-License-Identifier: private
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './Asset.sol';
import '../utils/ERC20Percentage.sol';

contract Market {
	struct SmartOffer {
		address seller;
		uint256 what;
		uint256 price;
		address money;
		uint256 sellID;
		uint256 expiration;
	}

	using ERC20Percentage for uint256;

	uint256 numSmartOffers;
	mapping(uint256 => SmartOffer) smartOffers;

	event NewSmartOffer(
		address indexed seller,
		uint256 what,
		uint256 price,
		address money,
		uint256 sellID
	);
	event CloseSmartOffer(address buyer, uint256 sellID);
	event NewLicence(
		address indexed buyer, 
		address indexed seller, 
		uint256 indexed newLicenceId
	);

	Asset public asset;
	uint256 constant LICENCE_BIT = 1 << 255;
	uint256 constant HUNDRED_PERCENT = 100_000_000; 

	constructor(address _assetAddress) {	
		asset = Asset(_assetAddress);
	}

	function sell(
		uint256 _what,
		uint256 _price,
		address _money
	) public returns (uint256 sellID) {
		require(
			asset.balanceOf(msg.sender, _what) >= 1, 
			'Failed to create new sell, insuffucient balance'
		);

		require(
			asset.isApprovedForAll(msg.sender, address(this)) == true,
			'This market has no approval to operate sellers assets, please '
		);
		sellID = numSmartOffers++;
		SmartOffer storage so = smartOffers[sellID];
		so.seller = msg.sender;
		so.what = _what;
		so.price = _price;
		so.money = _money;
		so.sellID = sellID;
		emit NewSmartOffer(msg.sender, _what, _price, _money, sellID);
	}

	function getSmartOffer(uint256 _sellID)
		public
		view
		returns (
			address seller,
			uint256 what,
			uint256 price,
			address money,
			uint256 sellID
		)
	{
		SmartOffer memory offer = smartOffers[_sellID];
		return (
			offer.seller, 
			offer.what, 
			offer.price, 
			offer.money, 
			offer.sellID
		);
	}

	function getSmartLicenceOffer(uint256 _sellID) public view {}

	function buy(uint256 _sellID) public {
		SmartOffer memory so = smartOffers[_sellID];
		address buyer = msg.sender;
		IERC20 money = IERC20(so.money);
		require(
			money.allowance(buyer, address(this)) >= so.price, 
			'Insufficient balance via allowance to purchase'
		);
		transferOnBuySingle(buyer, so.seller, so.price, so.what, money);
		
		asset.sendFrom(so.seller, buyer, so.what);
		emit CloseSmartOffer(buyer, _sellID);
	}

	function sellLicence(
		uint256 _what,
		uint256 _price,
		address _money,
		uint64 _expiration
	) public returns (uint256 sellID) {
		require(
			asset.balanceOf(msg.sender, _what) >= 1, 
			'Failed to create new sell, insuffucient balance'
		);

		require(
			asset.isPublic(_what) || asset.isAllowed(_what, address(this)),
			'Market does not have parent allowance'
		);

		sellID = numSmartOffers++ | LICENCE_BIT;
		SmartOffer storage so = smartOffers[sellID];
		so.seller = msg.sender;
		so.what = _what;
		so.price = _price;
		so.money = _money;
		so.sellID = sellID;
		so.expiration = block.timestamp + _expiration;
		emit NewSmartOffer(msg.sender, _what, _price, _money, sellID);
	}

	function buyLicence(uint256 _sellID) public {
		SmartOffer memory so = smartOffers[_sellID];
		address buyer = msg.sender;
		IERC20 money = IERC20(so.money);
		require(
			money.allowance(buyer, address(this)) >= so.price, 
			'Insufficient balance via allowance to purchase'
		);
		uint256 licenceID = asset.createLicence(so.what, buyer, so.expiration);
		money.transferFrom(buyer, so.seller, so.price);
		emit NewLicence(buyer, so.seller, licenceID);
	}

	/*
		========== Resellability ==========
	*/

	// map each sellID to sold asset's ID
	// mapping(uint256 => uint256) sellID_to_assetID;

	// create an owner history for each asset
	mapping(uint256 => address[]) assetOwnerHistory;

	// create a resell percentage values history for each asset
	mapping(uint256 => uint256[]) resellValuesHistory;

	mapping(uint256 => uint256[]) sellPriceHistory;

	// ensure that assets have either never been resold
	// or that they had no royalties added
	modifier levelOneResell(uint256 assetID) {
		uint256[] memory previousPercentages = listPercentages(assetID);
		uint256 nonZero = 0;
		for (uint256 i = 0; i < previousPercentages.length; i++) {
			if (previousPercentages[i] > 0) {
				nonZero++;
			}
		}
		require(nonZero < 1, 'Multi-level resell royalties currently unsupported.');
		_;
	}

	// add an owner to asset's history
	function appendOwner(uint256 assetID, address ownerAddress) private {
		assetOwnerHistory[assetID].push(ownerAddress);
	}

	// check asset's history
	function listOwners(uint256 assetID) public view returns (address[] memory) {
		return assetOwnerHistory[assetID];
	}

	// add a resell value to asset's history
	function appendResellPerc(uint256 assetID, uint256 percValue) private {
		resellValuesHistory[assetID].push(percValue);
	}

	// check asset's resell percentages
	function listPercentages(uint256 assetID) public view returns (uint256[] memory) {
		return resellValuesHistory[assetID];
	}

	function appendPrice(uint256 assetID, uint256 assetPrice) private {
		sellPriceHistory[assetID].push(assetPrice);
	}

	function listPrices(uint256 assetID) public view returns (uint256[] memory) {
		return sellPriceHistory[assetID];
	}

	function sellWithRoyalties (
		uint256 _what,
		uint256 _price,
		address _money,
		uint256 _royaltyPerc
	) public levelOneResell(_what) {

		sell(_what, _price, _money);

		// add owner to asset's history
		appendOwner(_what, msg.sender);

		// add price to asset's history
		appendPrice(_what, _price);

		// add royalty perc to asset's history
		appendResellPerc(_what, _royaltyPerc);
	}

	function transferOnBuySingle(
		address buyer, 
		address seller, 
		uint256 price, 
		uint256 assetID,
		IERC20 money) 
	private {
		
		// supports resell royalty of max depth 1
		uint256[] memory previousPercentages = listPercentages(assetID);
		uint256 previousPerc = 0;
		address previousOwner;
		uint256 nonZero = 0;

		// see how many resell royalty percentages have been set prior
		for (uint256 i = 0; i < previousPercentages.length; i++) {
			if (previousPercentages[i] > 0) {
				nonZero++;
				previousPerc = previousPercentages[i];
				previousOwner = listOwners(assetID)[i];
			}
		}
		require(nonZero <= 1, 'Compound resell royalties not yet fully supported.');
		uint256 moneyResale = (price * previousPerc)/HUNDRED_PERCENT;

		if (nonZero == 1) {
			money.transferFrom(buyer, previousOwner, moneyResale);
		}
		money.transferFrom(buyer, seller, price - moneyResale);
	}

}
