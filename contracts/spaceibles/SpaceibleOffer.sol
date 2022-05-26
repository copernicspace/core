// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';

import './SpaceibleAsset.sol';
import '../utils/ERC20Percentage.sol';
import '../utils/GeneratorID.sol';

contract SpaceibleOffer is GeneratorID {
    using ERC20Percentage for uint256;

    struct Offer {
        uint256 id;
        address seller;
        address assetAddress;
        uint256 assetId;
        uint256 amount;
        uint256 price;
        address money;
    }

    address public operator;
    uint256 public operatorFee;

    mapping(uint256 => Offer) private offers;

    event NewOffer(uint256 indexed id);
    event Buy(uint256 indexed id, uint256 amount, uint256 sellerFee, uint256 royaltiesFee, uint256 platformFee);

    constructor(address _operator, uint256 _operatorFee) {
        operator = _operator;
        operatorFee = _operatorFee;
    }

    function sell(
        address assetAddress,
        uint256 assetId,
        uint256 amount,
        uint256 price,
        address money
    ) public returns (uint256 id) {
        require(
            IERC1155(assetAddress).balanceOf(msg.sender, assetId) >= amount,
            'Failed to create new sell, insuffucient balance'
        );

        require(
            IERC1155(assetAddress).isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );

        id = generateId();

        Offer storage offer = offers[id];
        offer.id = id;
        offer.seller = msg.sender;
        offer.assetAddress = assetAddress;
        offer.assetId = assetId;
        offer.amount = price;
        offer.price = price;
        offer.money = money;

        emit NewOffer(id);
    }

    function getSmartOffer(uint256 id)
        public
        view
        returns (
            address seller,
            address assetAddress,
            uint256 assetId,
            uint256 amount,
            uint256 price,
            address money
        )
    {
        Offer memory offer = offers[id];
        return (offer.seller, offer.assetAddress, offer.assetId, offer.amount, offer.price, offer.money);
    }

    function buy(uint256 id, uint256 amount) public {
        Offer memory offer = offers[id];
        SpaceibleAsset asset = SpaceibleAsset(offer.assetAddress);
        require(offer.amount >= amount, 'Not enough asset balance on sale');
        IERC20 money = IERC20(offer.money);
        uint256 amountPrice = amount * offer.price;
        require(money.allowance(msg.sender, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');
        uint256 royalties = asset.getRoyalties(offer.assetId);
        address creator = asset.getCreator(offer.assetId);

        uint256 royaltiesFeeAmount;
        if (royalties == 0 || offer.seller == creator) {
            royaltiesFeeAmount = 0;
        } else {
            royaltiesFeeAmount = amount * royalties / 1e4;
        }
        uint256 operatorFeeAmount = amountPrice * operatorFee / 1e4;

        uint256 sellerFeeAmount = amountPrice - royaltiesFeeAmount - operatorFeeAmount;

        money.transferFrom(msg.sender, creator, royaltiesFeeAmount);
        money.transferFrom(msg.sender, operator, operatorFeeAmount);
        money.transferFrom(msg.sender, offer.seller, sellerFeeAmount);

        offer.amount = offer.amount - amount;
        asset.safeTransferFrom(offer.seller, msg.sender, offer.assetId, amount, '');

        emit Buy(id, amount, sellerFeeAmount, royaltiesFeeAmount, operatorFeeAmount);
    }
}
