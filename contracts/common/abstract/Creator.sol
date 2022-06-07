// SPDX-License-Identifier: private
pragma solidity ^0.8.14;

abstract contract Creator {
    event CreatorTransfer(address indexed from, address indexed to);

    address public creator;

    bool private creatorSet = false;

    function _setCreator(address _creator) internal {
        require(!creatorSet, 'creator already was set');
        creator = _creator;
        creatorSet = true;
        emit CreatorTransfer(address(0), _creator);
    }

    modifier onlyCreator() {
        require(msg.sender == creator, 'Creator: caller is not the creator');
        _;
    }

    function transferCreator(address newCreator) public onlyCreator {
        address oldCreator = creator;
        creator = newCreator;
        emit CreatorTransfer(oldCreator, newCreator);
    }
}
