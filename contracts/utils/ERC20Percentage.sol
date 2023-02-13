// SPDX-License-Identifier: private
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';

library ERC20Percentage {
    function take(
        uint256 amount,
        uint256 percentage,
        uint256 decimals
    ) internal pure returns (uint256 result) {
        uint256 baseDecimal = 10**(decimals + 2);
        uint256 normalized = (percentage * (10**decimals)) / (baseDecimal);
        result = (amount * (normalized)) / (10**decimals);
    }
}
