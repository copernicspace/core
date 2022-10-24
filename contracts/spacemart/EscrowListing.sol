// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

import './payload/PayloadAsset.sol';
import '../common/abstract/Creator.sol';
import '../utils/ERC20Percentage.sol';

contract EscrowListing {
    using SafeERC20 for ERC20;
    using ERC20Percentage for uint256;

    address public operator;
    uint256 public platformFee;

    struct Listing {
        address asset;
        uint256 assetID;
        address seller;
        uint256 amount;
        uint256 minAmount;
        uint256 price;
        address money;
    }

    uint256 private _numListings;
    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => bool) private _paused;
    mapping(uint256 => bool) private _canceled;

    struct Request {
        uint256 listingID;
        address buyer;
        uint256 amount;
        uint256 childAmount;
        string childName;
        uint256 amountPrice;
        bool active;
        string cid;
        uint256 sroyalties;
    }
    uint256 private _numRequests;
    mapping(uint256 => Request) private _requests;

    event Sell(uint256 indexed id);
    event RequestBuy(uint256 indexed id);
    event ApproveBuy(uint256 indexed id, uint256 sellerFeeAmount, uint256 platformFeeAmount);
    event Refund(uint256 indexed id);
    event Pause(uint256 indexed id);
    event Unpause(uint256 indexed id);
    event Cancel(uint256 indexed id);
    event Edit(uint256 indexed id, uint256 amount, uint256 price, address money);

    constructor(address _operator, uint256 _platformFee) {
        operator = _operator;
        platformFee = _platformFee;
    }

    function setOperator(address newOperator) public {
        require(msg.sender == operator, 'You are not allowed to set new operator');
        operator = newOperator;
    }

    function setPlatformFee(uint256 newPlatformFee) public {
        require(msg.sender == operator, 'You are not allowed to set new operator fee');
        platformFee = newPlatformFee;
    }

    function sell(
        address asset,
        uint256 assetID,
        uint256 amount,
        uint256 minAmount,
        uint256 price,
        address money
    ) public returns (uint256 id) {
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
        id = _numListings++;
        Listing storage listing = _listings[id];
        listing.asset = asset;
        listing.seller = msg.sender;
        listing.amount = amount;
        listing.minAmount = minAmount;
        listing.assetID = assetID;
        listing.price = price;
        listing.money = money;

        emit Sell(id);
    }

    function requestBuy(
        uint256 id,
        uint256 amount,
        uint256 childAmount,
        string memory childName,
        string memory cid,
        uint256 sroyalties
    ) public notCanceled(id) {
        require(!_paused[id], 'Listing is paused');
        Listing memory listing = _listings[id];

        require(listing.amount >= amount, 'Not enough asset balance on sale');
        require(amount >= listing.minAmount, 'Can not buy less than min amount');
        ERC20 money = ERC20(listing.money);
        address buyer = msg.sender;
        uint256 amountPrice = (amount * listing.price);
        require(money.allowance(buyer, address(this)) >= amountPrice, 'Insufficient balance via allowance to purchase');

        money.safeTransferFrom(msg.sender, address(this), amountPrice);
        uint256 requestID = _numRequests++;

        Request storage request = _requests[requestID];
        request.listingID = id;
        request.buyer = msg.sender;
        request.active = true;
        request.amount = amount;
        request.childAmount = childAmount;
        request.childName = childName;
        request.amountPrice = amountPrice;
        request.cid = cid;
        request.sroyalties = sroyalties;

        emit RequestBuy(requestID);
    }

    function approveBuy(uint256 id, string memory name) public {
        Request memory request = _requests[id];
        require(request.active, 'Request is not active');
        Listing memory listing = _listings[request.listingID];

        require(msg.sender == listing.seller, 'You are not allowed to confirm buy for selected listing');
        PayloadAsset asset = PayloadAsset(listing.asset);
        asset.createChildEscrow(
            msg.sender,
            request.amount,
            request.childAmount,
            listing.assetID,
            name,
            request.buyer,
            request.cid,
            request.sroyalties
        );

        uint256 decimals = Decimals(listing.asset).decimals();

        uint256 platformFeeAmount = request.amountPrice.take(platformFee, decimals);
        uint256 sellerFeeAmount = request.amountPrice - platformFeeAmount;

        ERC20(listing.money).safeTransfer(operator, platformFeeAmount);
        ERC20(listing.money).safeTransfer(listing.seller, sellerFeeAmount);

        listing.amount -= request.amount;
        emit ApproveBuy(id, sellerFeeAmount, platformFeeAmount);
    }

    function refund(uint256 requestID) public {
        Request storage request = _requests[requestID];
        Listing memory listing = _listings[request.listingID];

        require(request.active, 'Request is not active');
        require(msg.sender == request.buyer || msg.sender == listing.seller, 'You are not allowed to refund this!');

        ERC20(listing.money).safeTransferFrom(address(this), request.buyer, request.amountPrice);
        request.active = false;

        emit Refund(requestID);
    }

    function getEscrowListing(uint256 id)
        public
        view
        returns (
            address asset,
            uint256 assetID,
            address seller,
            uint256 amount,
            uint256 minAmount,
            uint256 price,
            address money
        )
    {
        Listing memory listing = _listings[id];
        return (
            listing.asset,
            listing.assetID,
            listing.seller,
            listing.amount,
            listing.minAmount,
            listing.price,
            listing.money
        );
    }

    function getRequest(uint256 id)
        public
        view
        returns (
            uint256 listingID,
            address buyer,
            uint256 amount,
            uint256 childAmount,
            string memory childName,
            uint256 amountPrice,
            bool active,
            string memory cid,
            uint256 sroyalties
        )
    {
        Request memory request = _requests[id];
        return (
            request.listingID,
            request.buyer,
            request.amount,
            request.childAmount,
            request.childName,
            request.amountPrice,
            request.active,
            request.cid,
            request.sroyalties
        );
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
        emit Cancel(id);
    }

    function isCanceled(uint256 id) public view returns (bool) {
        return _canceled[id];
    }

    modifier notCanceled(uint256 id) {
        require(!isCanceled(id), 'Listing is canceled');
        _;
    }
}
