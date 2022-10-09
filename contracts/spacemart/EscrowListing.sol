// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

import './payload/PayloadAsset.sol';
import '../common/abstract/Creator.sol';
import '../utils/ERC20Percentage.sol';

contract EscrowListing {
    using SafeERC20 for IERC20;
    using ERC20Percentage for uint256;

    struct Listing {
        uint256 id;
        address asset;
        uint256 assetID;
        address seller;
        uint256 amount;
        uint256 minAmount;
        uint256 price;
        address money;
    }

    address public operator;
    uint256 public operatorFee;

    uint256 private _numListings;
    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => bool) private _paused;
    mapping(uint256 => bool) private _canceled;

    mapping(address => mapping(uint256 => uint256)) private balancesOnListings;

    event Sell(uint256 indexed id);
    event Buy(
        uint256 indexed id,
        uint256 amount,
        uint256 sellerFee,
        uint256 rootRoyaltiesFee,
        uint256 secondaryRoyaltiesFee,
        uint256 platformFee
    );
    event BuyRequest(uint256 indexed id, address indexed buyer, uint256 amount, uint256 burnAmount, string cid);
    event Pause(uint256 indexed id);
    event Unpause(uint256 indexed id);
    event Cancel(uint256 indexed id);
    event Edit(uint256 indexed id, uint256 amount, uint256 price, address money);

    constructor(address _operator, uint256 _operatorFee) {
        operator = _operator;
        operatorFee = _operatorFee;
    }

    function setOperator(address newOperator) public {
        require(msg.sender == operator, 'You are not allowed to set new operator');
        operator = newOperator;
    }

    function setOperatorFee(uint256 newOperatorFee) public {
        require(msg.sender == operator, 'You are not allowed to set new operator fee');
        operatorFee = newOperatorFee;
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
            PayloadAsset(asset).getCreateChildAllowance(address(this)),
            'Add allowance to EscrowListing contract in PayloadAsset '
        );

        address creator = Creator(asset).creator();

        require(msg.sender == creator || !Pausable(asset).paused(), 'Pausable: asset is locked');
        sellID = _numListings++;
        Listing storage listing = _listings[sellID];
        listing.asset = asset;
        listing.seller = msg.sender;
        listing.amount = amount;
        listing.minAmount = minAmount;
        listing.assetID = assetID;
        listing.price = price;
        listing.money = money;
        listing.id = sellID;

        emit Sell(sellID);
    }

    function buyRequest(
        uint256 sellID,
        uint256 amount,
        uint256 burnAmount,
        string memory cid,
        uint256 sroyalties
    ) public {
        Listing memory listing = _listings[sellID];
        uint256 decimals = Decimals(listing.asset).decimals();

        require(listing.amount >= amount, 'Not enough asset balance on sale');
        require(amount >= listing.minAmount, 'Can not buy less than min amount');
        address buyer = msg.sender;
        uint256 decimalAmount = amount / (10**decimals);
        uint256 amountPrice = decimalAmount * listing.price;
        require(
            IERC20(listing.money).allowance(buyer, address(this)) >= amountPrice,
            'Insufficient balance via allowance to purchase'
        );

        IERC20(listing.money).safeTransferFrom(msg.sender, address(this), amountPrice);

        emit BuyRequest(sellID, msg.sender, amount, burnAmount, cid);
    }

    function confirmBuy(
        uint256 sellID,
        uint256 amount,
        uint256 burnAmount,
        string memory name,
        address to,
        string memory cid,
        uint256 sroyalties
    ) public {
        Listing memory listing = _listings[sellID];

        require(msg.sender == listing.seller, 'You are not allowed to confirm buy for selected listing');
        PayloadAsset asset = PayloadAsset(listing.asset);
        asset.createChildEscrow(amount, burnAmount, listing.assetID, name, to, cid, sroyalties);
        uint256 decimals = Decimals(listing.asset).decimals();

        uint256 decimalAmount = amount / (10**decimals);
        uint256 amountPrice = decimalAmount * listing.price;

        uint256 operatorFeeAmount = amountPrice.take(operatorFee, decimals);
        IERC20(listing.money).safeTransfer(operator, operatorFeeAmount);

        uint256 totalPriceWithoutFee = amountPrice - operatorFeeAmount;
        IERC20(listing.money).safeTransfer(listing.seller, totalPriceWithoutFee);

        emit BuyRequest(sellID, to, amount, burnAmount, cid);
    }
}
