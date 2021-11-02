pragma solidity ^0.8.9;

interface PayloadPausable {
    
    // custom implementation of Pausable on per-asset-id basis

    function pauseAsset(uint256 _id) external;
    function unPauseAsset(uint256 _id) external;
}