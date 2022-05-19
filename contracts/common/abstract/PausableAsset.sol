// SPDX-License-Identifier: private
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/security/Pausable.sol';

import './Creator.sol';

abstract contract PausableAsset is Pausable, Creator {

    function _setPause(bool isPause) internal {
        if (isPause) {
            _pause();
        }
    }

    function pause() public onlyCreator {
        _pause();
    }

    function unpause() public onlyCreator {
        _unpause();
    }
}
