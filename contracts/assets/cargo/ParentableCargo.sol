// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/Context.sol';

import '../interfaces/Parentable.sol';

abstract contract ParentableCargo is Parentable, Context {
    mapping(uint256 => uint256) internal _parents;
    mapping(uint256 => string) internal _names;

    function getFullName(uint256 id) public view returns (string memory) {
        if (id != 0) {
            uint256 pid = _parents[id];
            string memory pname = getFullName(pid);
            return string(bytes.concat(bytes(pname), '/', bytes(_names[id])));
        } else {
            return _names[id];
        }
    }

    function getParent(uint256 id) public view override(Parentable) returns (uint256) {
        return _parents[id];
    }

    function getName(uint256 id) public view override(Parentable) returns (string memory) {
        return _names[id];
    }
}
