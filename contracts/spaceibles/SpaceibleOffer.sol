// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

import '../common/abstract/Royalties.sol';
import '../common/abstract/Decimals.sol';
import '../common/abstract/Creator.sol';
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

    address public platformOperator;
    uint256 public operatorFee;
    mapping(uint256 => Offer) private offers;

    event NewOffer(uint256 indexed id);

    constructor(address _platformOperator, uint256 _operatorFee) {
        platformOperator = _platformOperator;
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

        require(
            msg.sender == Creator(assetAddress).creator() || !Pausable(assetAddress).paused(),
            'Pausable: asset is locked or msg.sender is not a creator'
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

    //todo refactor `buy`
    // function buy(uint256 sellID, uint256 amount) public {
    //     Offer memory offer = offers[sellID];
    //     uint256 decimals = Decimals(offer.asset).decimals();

    //     require(offer.amount >= amount, 'Not enough asset balance on sale');
    //     require(amount >= offer.minAmount, 'Can not buy less than min amount');
    //     address buyer = msg.sender;
    //     IERC20 money = IERC20(offer.money);
    //     uint256 decimalAmount = amount / (10**decimals);
    //     uint256 amountPrice = decimalAmount * offer.price;
    //     require(money.allowance(buyer, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');
    //     address assetOwner = Creator(offer.asset).creator();
    //     uint256 royalties = Royalties(offer.asset).royalties();

    //     if (offer.seller == assetOwner || royalties == 0) {
    //         //todo add operator fee!
    //         money.transferFrom(buyer, offer.seller, amountPrice);
    //     } else {
    //         uint256 royaltiesAmount = amountPrice.take(royalties, decimals);
    //         uint256 operatorFeeAmount = amountPrice.take(operatorFee, decimals);
    //         uint256 totalPriceWithoutRoyaltiesAndFee = amountPrice - royaltiesAmount - operatorFeeAmount;

    //         money.transferFrom(buyer, assetOwner, royaltiesAmount);
    //         money.transferFrom(buyer, platformOperator, operatorFeeAmount);
    //         money.transferFrom(buyer, offer.seller, totalPriceWithoutRoyaltiesAndFee);
    //     }

    //     offer.amount = offer.amount - amount;
    //     ERC1155(offer.asset).safeTransferFrom(offer.seller, buyer, offer.assetId, amount, '');
    //     // emit Buy(buyer, sellID);
    // }
}
