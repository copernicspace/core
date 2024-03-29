// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';

import './SpaceibleAsset.sol';
import '../utils/ERC20Percentage.sol';
import '../utils/GeneratorID.sol';

contract SpaceibleOffer is GeneratorID {
    using SafeERC20 for IERC20;

    struct Offer {
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

    mapping(uint256 => Offer) private _offers;
    mapping(uint256 => bool) private _paused;
    mapping(uint256 => bool) private _canceled;

    mapping(address => mapping(uint256 => uint256)) private balancesOnOffers;

    event Sell(uint256 indexed id);
    event Buy(uint256 indexed id, uint256 amount, uint256 sellerFee, uint256 royaltiesFee, uint256 platformFee);
    event Pause(uint256 indexed id);
    event Unpause(uint256 indexed id);
    event Cancel(uint256 indexed id);
    event Edit(uint256 indexed id, uint256 amount, uint256 price, address money);

    constructor(
        address _operator,
        uint256 _operatorFee,
        address _assetAddress
    ) {
        operator = _operator;
        operatorFee = _operatorFee;
        assetAddress = _assetAddress;
    }

    function sell(
        uint256 assetId,
        uint256 amount,
        uint256 price,
        address money
    ) public returns (uint256 id) {
        require(
            IERC1155(assetAddress).balanceOf(msg.sender, assetId) >= balancesOnOffers[msg.sender][assetId] + amount,
            'Asset amount across offers exceeds available balance'
        );

        require(
            IERC1155(assetAddress).isApprovedForAll(msg.sender, address(this)) == true,
            'This contract has no approval to operate sellers assets'
        );

        id = generateId();

        Offer storage offer = _offers[id];
        offer.id = id;
        offer.seller = msg.sender;
        offer.assetId = assetId;
        offer.amount = amount;
        offer.price = price;
        offer.money = money;

        balancesOnOffers[msg.sender][assetId] += amount;

        emit Sell(id);
    }

    function get(uint256 id)
        public
        view
        returns (
            address seller,
            uint256 assetId,
            uint256 amount,
            uint256 price,
            address money
        )
    {
        Offer memory offer = _offers[id];
        return (offer.seller, offer.assetId, offer.amount, offer.price, offer.money);
    }

    function edit(
        uint256 id,
        uint256 amount,
        uint256 price,
        address money
    ) public notCanceled(id) {
        Offer storage offer = _offers[id];
        require(msg.sender == offer.seller, 'Only offer creator can edit');

        cancel(offer.id);

        sell(offer.assetId, amount, price, money);
    }

    function buy(uint256 id, uint256 amount) public notCanceled(id) {
        require(_paused[id] != true, 'Offer is paused');
        Offer storage offer = _offers[id];
        SpaceibleAsset asset = SpaceibleAsset(assetAddress);
        require(offer.amount >= amount, 'Not enough asset balance on sale');
        IERC20 money = IERC20(offer.money);
        uint256 amountPrice = amount * offer.price;
        require(
            money.allowance(msg.sender, address(this)) >= amountPrice,
            'Insufficient balance via allowance to purchase'
        );
        uint256 royalties = asset.getRoyalties(offer.assetId);
        address creator = asset.getCreator(offer.assetId);

        uint256 royaltiesFeeAmount;
        if (royalties == 0 || offer.seller == creator) {
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
        money.safeTransferFrom(msg.sender, offer.seller, sellerFeeAmount);

        offer.amount -= amount;
        balancesOnOffers[offer.seller][offer.assetId] -= amount;

        asset.safeTransferFrom(offer.seller, msg.sender, offer.assetId, amount, '');

        emit Buy(id, amount, sellerFeeAmount, royaltiesFeeAmount, operatorFeeAmount);
    }

    function getAvailableBalance(address user, uint256 assetId) public view returns (uint256 availableBalance) {
        return IERC1155(assetAddress).balanceOf(user, assetId) - balancesOnOffers[user][assetId];
    }

    function pause(uint256 id) public notCanceled(id) {
        Offer memory offer = _offers[id];
        require(msg.sender == offer.seller, 'Only offer seller can pause');
        _paused[id] = true;
        emit Pause(id);
    }

    function unpause(uint256 id) public notCanceled(id) {
        Offer memory offer = _offers[id];
        require(msg.sender == offer.seller, 'Only offer seller can unpause');
        _paused[id] = false;
        emit Unpause(id);
    }

    function isPaused(uint256 id) public view returns (bool) {
        return _paused[id];
    }

    function cancel(uint256 id) public notCanceled(id) {
        Offer memory offer = _offers[id];
        require(msg.sender == offer.seller, 'Only offer seller can cancel');
        _canceled[id] = true;
        balancesOnOffers[offer.seller][offer.assetId] -= offer.amount;
        emit Cancel(id);
    }

    function isCanceled(uint256 id) public view returns (bool) {
        return _canceled[id];
    }

    modifier notCanceled(uint256 id) {
        require(_canceled[id] != true, 'Offer is canceled');
        _;
    }
}
