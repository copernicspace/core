// SPDX-License-Identifier: private
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '../interfaces/PayloadPausable.sol';
import '../interfaces/PayloadParentable.sol';

contract SpacePayloadAsset is ERC1155, PayloadPausable, PayloadParentable {
	uint256 private nonce;
	uint256 public constant decimals = 18;

	function generateNewId() internal returns (uint256) {
		return ++nonce;
	}

	constructor(string memory uri) ERC1155(uri) {}

	// additional owner-creator mapping (to retain the original creator of asset
	// and not only the current owners)
	// ^ distinction between asset creator & asset owner
	mapping(uint256 => address) creators;

	modifier onlyAssetOwner(uint256 _id) {
		require(balanceOf(msg.sender, _id) > 0, 'Not owner');
		_;
	}

	modifier onlyAssetCreator(uint256 _id, address _caller) {
		require(
			creators[_id] == _caller,
			'Caller is not the creator of asset'
		);
		_;
	}

	event RootAssetCreation(address _to, uint256 _id, uint256 _amount);
	event AssetCreation(address _to, uint256 _id, uint256 _amount, uint256 _pid);

	event Transfer(address _to, uint256 _id, uint256 _amount);
	event TransferFrom(address _from, address _to, uint256 _id, uint256 _amount);

	function createRootAsset(uint256 grams) external {
		uint256 id = generateNewId();
		uint256 amount = grams * 10**decimals;

		_mint(msg.sender, id, amount, '');

		// auto set to paused state
		paused[id] = true;

		addCreator(id, msg.sender);

		emit RootAssetCreation(msg.sender, id, amount);
	}

	function addCreator(uint256 _id, address _creator) private {
		creators[_id] = _creator;
	}

	function createAsset(uint256 grams, uint256 pid) external {
		require(
			balanceOf(msg.sender, pid) >= grams * 10 ** decimals,
			'Required child asset weight exceeds the creator balance'
		);
		uint256 id = generateNewId();
		uint256 amount = grams * 10**decimals;

		_mint(msg.sender, id, amount, '');

		// auto set to paused state
		paused[id] = true;

		setParent(id, pid);
		addCreator(id, msg.sender);

		emit AssetCreation(msg.sender, id, amount, pid);
	}

	function send(
		address _to,
		uint256 _id,
		uint256 _amount
	) public assetNotPaused(_id) {
		require(balanceOf(msg.sender, _id) >= _amount, 'Insufficient balance');
		safeTransferFrom(msg.sender, _to, _id, _amount, '');
		emit Transfer(_to, _id, _amount);
	}

	function sendFrom(
		address _from,
		address _to,
		uint256 _id,
		uint256 _amount
	) public assetNotPaused(_id) {
		require(balanceOf(_from, _id) >= _amount, 'Insufficient balance');
		require(
			isApprovedForAll(_from, msg.sender), 
			'Required operator is not approved by owner'
		);
		safeTransferFrom(_from, _to, _id, _amount, '');
		emit TransferFrom(_from, _to, _id, _amount);
	}

	/*
		Pausable interface implementation

		pausing assets on per-id basis
		to allow control of the flow of assets after creation

		After creation each asset defaults to 'paused' state
		and can be unpaused by the owner

	*/
	mapping(uint256 => bool) public paused;


	// Hierarchy if-paused checking in modifiers
	modifier assetNotPaused(uint256 _id) {
		require(!paused[_id], 'Asset paused');

		if(parentIds[_id] != 0) {
			uint256 test_id = parentIds[_id];

			while(test_id != 0) {
				require(
					!paused[test_id],
					'Asset in hierarchy paused'
				);
				test_id = parentIds[test_id];
			}
		}
		_;
	}
	modifier assetPaused(uint256 _id) {
		require(paused[_id], 'Asset not paused');

		if(parentIds[_id] != 0) {
			uint256 test_id = parentIds[_id];

			while(test_id != 0) {
				require(
					paused[test_id],
					'Asset in hierarchy not paused'
				);
				test_id = parentIds[test_id];
			}
		}
		_;
	}

	function pauseAsset(uint256 _id) public override onlyAssetCreator(_id, msg.sender) {
		paused[_id] = true;
		emit Pause(msg.sender, _id);
	}

	function unPauseAsset(uint256 _id) public override onlyAssetCreator(_id, msg.sender) {
		paused[_id] = false;
		emit unPause(msg.sender, _id);
	}

	event Pause(address invoker, uint256 _id);
	event unPause(address invoker, uint256 _id);

	/*
		Parentable interface implementation

		creation of 'child' assets
		based on a 'parent' asset
	*/

	mapping(uint256 => uint256) public parentIds;

	function setParent(uint256 id, uint256 pid) private {
		parentIds[id] = pid;
	}
}
