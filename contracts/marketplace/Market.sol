// SPDX-License-Identifier: private
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './Asset.sol';

contract Market {
	struct SmartOffer {
		address seller;
		uint256 what;
		uint256 price;
		address money;
		uint256 sellID;
		uint256 expiration;
	}

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
		money.transferFrom(buyer, so.seller, so.price);
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
}
