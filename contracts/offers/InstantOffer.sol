// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

import '../assets/abstract/Royalties.sol';
import '../assets/abstract/Decimals.sol';
import '../assets/abstract/Creator.sol';
import '../utils/ERC20Percentage.sol';

contract InstantOffer {
    using ERC20Percentage for uint256;

    address public platformOperator;
    uint256 public operatorFee;

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
        uint256 amount;
        uint256 minAmount;
        uint256 assetID;
        uint256 price;
        address money;
        uint256 sellID;
    }

    uint256 private numOffers;
    mapping(uint256 => Offer) private offers;

    constructor(address _platformOperator, uint256 _operatorFee) {
        platformOperator = _platformOperator;
        operatorFee = _operatorFee;
    }

    function sell(
        address asset,
        uint256 assetID,
        uint256 amount,
        uint256 minAmount,
        uint256 price,
        address money
    ) public returns (uint256 sellID) {
        require(
            IERC1155(asset).balanceOf(msg.sender, assetID) >= amount,
            'Failed to create new sell, insuffucient balance'
        );
        require(
            IERC1155(asset).isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );

        address creator = Creator(asset).creator();
        
        require(msg.sender == creator || !Pausable(asset).paused(), 'Pausable: asset is locked');

        sellID = numOffers++;
        Offer storage offer = offers[sellID];
        offer.asset = asset;
        offer.seller = msg.sender;
        offer.amount = amount;
        offer.minAmount = minAmount;
        offer.assetID = assetID;
        offer.price = price;
        offer.money = money;
        offer.sellID = sellID;
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
        uint256 decimals = Decimals(offer.asset).decimals();

        require(offer.amount >= amount, 'Not enough asset balance on sale');
        require(amount >= offer.minAmount, 'Can not buy less than min amount');
        address buyer = msg.sender;
        IERC20 money = IERC20(offer.money);
        uint256 decimalAmount = amount / (10**decimals);
        uint256 amountPrice = decimalAmount * offer.price;
        require(money.allowance(buyer, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');
        address assetOwner = Creator(offer.asset).creator();
        uint256 royalties = Royalties(offer.asset).royalties();

        if (offer.seller == assetOwner || royalties == 0) {
            //todo add operator fee!
            money.transferFrom(buyer, offer.seller, amountPrice);
        } else {
            uint256 royaltiesAmount = amountPrice.take(royalties, decimals);
            uint256 operatorFeeAmount = amountPrice.take(operatorFee, decimals);
            uint256 totalPriceWithoutRoyaltiesAndFee = amountPrice - royaltiesAmount - operatorFeeAmount;

            money.transferFrom(buyer, assetOwner, royaltiesAmount);
            money.transferFrom(buyer, platformOperator, operatorFeeAmount);
            money.transferFrom(buyer, offer.seller, totalPriceWithoutRoyaltiesAndFee);
        }

        offer.amount = offer.amount - amount;
        ERC1155(offer.asset).safeTransferFrom(offer.seller, buyer, offer.assetID, amount, '');
        emit Buy(buyer, sellID);
    }
}
