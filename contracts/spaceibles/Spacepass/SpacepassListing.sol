// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../../utils/ERC20Percentage.sol';
import '../../utils/GeneratorID.sol';
import './SpacepassAsset.sol';

contract SpacepassListing is GeneratorID {
    using SafeERC20 for IERC20;

    struct Listing {
        uint256 id;
        address seller;
        uint256 assetId;
        uint256 amount;
        uint256 price;
        address money;
    }

    address public operator;
    uint256 public operatorFee;
    address public assetAddress;

    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => bool) private _paused;
    mapping(uint256 => bool) private _canceled;

    mapping(address => mapping(uint256 => uint256)) private balancesOnListings;

    event Sell(uint256 indexed id);
    event Buy(uint256 indexed id, uint256 amount, uint256 sellerFee, uint256 royaltiesFee, uint256 platformFee);
    event Pause(uint256 indexed id);
    event Unpause(uint256 indexed id);
    event Cancel(uint256 indexed id);
    event Edit(uint256 indexed id, uint256 amount, uint256 price, address money);

    constructor(address _operator, uint256 _operatorFee, address _assetAddress) {
        operator = _operator;
        operatorFee = _operatorFee;
        assetAddress = _assetAddress;
    }

    function sell(uint256 assetId, uint256 amount, uint256 price, address money) public returns (uint256 id) {
        require(
            IERC1155(assetAddress).balanceOf(msg.sender, assetId) >= balancesOnListings[msg.sender][assetId] + amount,
            'Asset amount across listings exceeds available balance'
        );

        require(
            IERC1155(assetAddress).isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );

        id = generateId();

        Listing storage listing = _listings[id];
        listing.id = id;
        listing.seller = msg.sender;
        listing.assetId = assetId;
        listing.amount = amount;
        listing.price = price;
        listing.money = money;

        balancesOnListings[msg.sender][assetId] += amount;

        emit Sell(id);
    }

    function get(
        uint256 id
    ) public view returns (address seller, uint256 assetId, uint256 amount, uint256 price, address money) {
        Listing memory listing = _listings[id];
        return (listing.seller, listing.assetId, listing.amount, listing.price, listing.money);
    }

    function edit(uint256 id, uint256 amount, uint256 price, address money) public notCanceled(id) {
        Listing storage listing = _listings[id];
        require(msg.sender == listing.seller, 'Only listing creator can edit');

        cancel(listing.id);
        sell(listing.assetId, amount, price, money);
    }

    function buy(uint256 id, uint256 amount) public notCanceled(id) {
        require(_paused[id] != true, 'Listing is paused');
        Listing storage listing = _listings[id];
        SpacepassAsset asset = SpacepassAsset(assetAddress);
        require(listing.amount >= amount, 'Not enough asset balance on sale');
        IERC20 money = IERC20(listing.money);
        uint256 amountPrice = amount * listing.price;
        require(
            money.allowance(msg.sender, address(this)) >= amountPrice,
            'Insufficient balance via allowance to purchase'
        );
        uint256 royalties = asset.getRoyalties(listing.assetId);
        address creator = asset.getCreator(listing.assetId);

        uint256 royaltiesFeeAmount;
        if (royalties == 0 || listing.seller == creator) {
            royaltiesFeeAmount = 0;
        } else {
            royaltiesFeeAmount = (amountPrice * royalties) / 1e4;
        }
        uint256 operatorFeeAmount = (amountPrice * operatorFee) / 1e4;

        uint256 sellerFeeAmount = amountPrice - royaltiesFeeAmount - operatorFeeAmount;

        // do not send 0 amount ERC20 transfer
        if (royaltiesFeeAmount > 0) {
            money.safeTransferFrom(msg.sender, creator, royaltiesFeeAmount);
        }
        money.safeTransferFrom(msg.sender, operator, operatorFeeAmount);
        money.safeTransferFrom(msg.sender, listing.seller, sellerFeeAmount);

        listing.amount -= amount;
        balancesOnListings[listing.seller][listing.assetId] -= amount;

        asset.safeTransferFrom(listing.seller, msg.sender, listing.assetId, amount, '');

        emit Buy(id, amount, sellerFeeAmount, royaltiesFeeAmount, operatorFeeAmount);
    }

    function getAvailableBalance(address user, uint256 assetId) public view returns (uint256 availableBalance) {
        return IERC1155(assetAddress).balanceOf(user, assetId) - balancesOnListings[user][assetId];
    }

    function pause(uint256 id) public notCanceled(id) {
        Listing memory listing = _listings[id];
        require(msg.sender == listing.seller, 'Only listing seller can pause');
        _paused[id] = true;
        emit Pause(id);
    }

    function unpause(uint256 id) public notCanceled(id) {
        Listing memory listing = _listings[id];
        require(msg.sender == listing.seller, 'Only listing seller can unpause');
        _paused[id] = false;
        emit Unpause(id);
    }

    function isPaused(uint256 id) public view returns (bool) {
        return _paused[id];
    }

    function cancel(uint256 id) public notCanceled(id) {
        Listing memory listing = _listings[id];
        require(msg.sender == listing.seller, 'Only listing seller can cancel');
        _canceled[id] = true;
        balancesOnListings[listing.seller][listing.assetId] -= listing.amount;
        emit Cancel(id);
    }

    function isCanceled(uint256 id) public view returns (bool) {
        return _canceled[id];
    }

    modifier notCanceled(uint256 id) {
        require(_canceled[id] != true, 'Listing is canceled');
        _;
    }
}
