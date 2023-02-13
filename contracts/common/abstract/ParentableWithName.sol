// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '../interfaces/IParentableWithName.sol';

abstract contract ParentableWithName is IParentableWithName {
    mapping(uint256 => uint256) private _parents;
    mapping(uint256 => string) private _names;

    function _setParent(uint256 id, uint256 pid) internal virtual {
        _parents[id] = pid;
    }

    function getParent(uint256 id) public view override(IParentableWithName) returns (uint256) {
        return _parents[id];
    }

    function _setName(uint256 id, string memory name) internal virtual {
        _names[id] = name;
    }

    function getName(uint256 id) public view virtual override(IParentableWithName) returns (string memory) {
        return _names[id];
    }

    function getFullName(uint256 id) public view returns (string memory) {
        if (id != 0) {
            uint256 pid = _parents[id];
            string memory pname = getFullName(pid);
            return string(bytes.concat(bytes(pname), '/', bytes(_names[id])));
        } else {
            return _names[id];
        }
    }
}
