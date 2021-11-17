// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

interface Pausable {
    event Paused();
    event Unpaused();

    function pause() external;

    function unpause() external;
}
