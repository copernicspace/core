// SPDX-License-Identifier: private
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../assets/cargo/CargoAsset.sol';

contract InstantOffer {
    using SafeMath for uint256;

    event NewOffer(
        address indexed seller,
        address indexed asset,
        uint256 indexed assetID,
        uint256 amount,
        uint256 price,
        address money,
        uint256 sellID
    );

    event Buy(address buyer, uint256 sellID);

    struct Offer {
        address asset;
        address seller;
        uint256 assetID;
        uint256 price;
        address money;
        uint256 sellID;
    }

    uint256 private numOffers;
    mapping(uint256 => Offer) private offers;

    constructor() {}

    function sell(
        address asset,
        uint256 assetID,
        uint256 amount,
        uint256 price,
        address money
    ) public returns (uint256 sellID) {
        require(
            CargoAsset(asset).balanceOf(msg.sender, assetID) >= 1,
            'Failed to create new sell, insuffucient balance'
        );

        require(
            CargoAsset(asset).isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );
        sellID = numOffers++;
        Offer storage offer = offers[sellID];
        offer.asset = asset;
        offer.seller = msg.sender;
        offer.assetID = assetID;
        offer.price = price;
        offer.money = money;
        offer.sellID = sellID;
        // todo add amount to offer 
        emit NewOffer(msg.sender, asset, assetID, amount, price, money, sellID);
    }

    function getSmartOffer(uint256 _sellID)
        public
        view
        returns (
            address seller,
            uint256 assetID,
            uint256 price,
            address money,
            uint256 sellID
        )
    {
        Offer memory offer = offers[_sellID];
        return (offer.seller, offer.assetID, offer.price, offer.money, offer.sellID);
    }

    /** 
        amount has to be in decimal form
     */
    function buy(uint256 sellID, uint256 amount) public {
        Offer memory offer = offers[sellID];
        CargoAsset asset = CargoAsset(offer.asset);
        address buyer = msg.sender;
        IERC20 money = IERC20(offer.money);
        uint256 decimals = asset.decimals();
        uint256 amountPrice = amount.mul(offer.price); 
        require(money.allowance(buyer, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');
        money.transferFrom(buyer, offer.seller, amountPrice);
        uint256 uintAmount = amount.mul(10**18);
        asset.sendFrom(offer.seller, buyer, offer.assetID, uintAmount);
        emit Buy(buyer, sellID);
    }
}
