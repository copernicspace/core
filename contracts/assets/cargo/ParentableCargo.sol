// SPDX-License-Identifier: private
pragma solidity ^0.8.9;
import '../interfaces/Parentable.sol';

abstract contract ParentableCargo is Parentable {
    mapping(uint256 => uint256) internal _parents;

    function createChild(uint256 pid, uint256 amount) external virtual;

    function getParent(uint256 id)
        public
        view
        override(Parentable)
        returns (uint256)
    {
        return _parents[id];
    }
}
