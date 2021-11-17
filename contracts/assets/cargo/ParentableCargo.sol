// SPDX-License-Identifier: private
pragma solidity ^0.8.9;
import '../interfaces/Parentable.sol';

import '@openzeppelin/contracts/utils/Context.sol';

abstract contract ParentableCargo is Parentable, Context {
    mapping(uint256 => uint256) internal _parents;
    mapping(uint256 => string) internal _names;

    // A --> B --> C
    function getFullName(uint256 id) public view returns (string memory) {
        uint256 pid = getParent(id);
        if (pid == 0) {
            return _names[pid];
        } else {
            string memory pname = getFullName(pid);
            return string(bytes.concat(bytes(_names[id]), '//', bytes(pname)));
        }
    }

    function createChild(
        uint256 amount,
        uint256 pid,
        string memory name,
        address to
    ) external virtual;

    function getParent(uint256 id) public view override(Parentable) returns (uint256) {
        return _parents[id];
    }

    function getName(uint256 id) public view override(Parentable) returns (string memory) {
        return _names[id];
    }
}
