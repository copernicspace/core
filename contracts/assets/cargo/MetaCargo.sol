// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import './ParentableCargo.sol';

abstract contract MetaCargo is ParentableCargo {
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
}
