// SPDX-License-Identifier: private
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../assets/cargo/CargoAsset.sol';
import 'hardhat/console.sol';

contract InstantOffer {
    event NewOffer(
        address indexed seller,
        uint256 indexed what,
        uint256 indexed amount,
        uint256 price,
        address money,
        uint256 sellID
    );

    event Buy(address buyer, uint256 sellID);

    struct Offer {
        address seller;
        uint256 what;
        uint256 price;
        address money;
        uint256 sellID;
    }

    uint256 private numOffers;
    mapping(uint256 => Offer) private offers;

    CargoAsset public asset;

    constructor(address _asset) {
        asset = CargoAsset(_asset);
    }

    function sell(
        uint256 what,
        uint256 amount,
        uint256 price,
        address money
    ) public returns (uint256 sellID) {
        require(asset.balanceOf(msg.sender, what) >= 1, 'Failed to create new sell, insuffucient balance');

        require(
            asset.isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );
        sellID = numOffers++;
        Offer storage offer = offers[sellID];
        offer.seller = msg.sender;
        offer.what = what;
        offer.price = price;
        offer.money = money;
        offer.sellID = sellID;
        emit NewOffer(msg.sender, what, amount, price, money, sellID);
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
        Offer memory offer = offers[_sellID];
        return (offer.seller, offer.what, offer.price, offer.money, offer.sellID);
    }

    function buy(uint256 sellID, uint256 amount) public {
        Offer memory so = offers[sellID];
        address buyer = msg.sender;
        IERC20 money = IERC20(so.money);
        uint256 amountPrice = amount * so.price;
        require(money.allowance(buyer, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');
        money.transferFrom(buyer, so.seller, amountPrice);
        console.log(so.seller);
        console.log(buyer);
        console.log(so.what);
        console.log(amount);

        asset.sendFrom(so.seller, buyer, so.what, amount);
        emit Buy(buyer, sellID);
    }
}
