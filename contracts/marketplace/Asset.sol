// SPDX-License-Identifier: private
pragma solidity =0.8.4;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import './interfaces/Parentable.sol';
import './interfaces/Licenseble.sol';
import './interfaces/Divisible.sol';

contract Asset is ERC1155, Parentable, Licencable, Divisible {
	constructor(string memory uri) ERC1155(uri) {}

	//  input value for new assets id generation
	uint256 private nonce;

	function generateNewId() internal returns (uint256) {
		return ++nonce;
	}

	/**
    This  method creates root asset
    */
	function createRoot(
		bool _isPublic,
		bool _isDivisible,
		uint256 _weight
	) public {
		// step 1: generate id of new asset
		uint256 id = generateNewId();
		// step 2: mint new token
		_mint(msg.sender, id, 1, '');
		// step 3: set derivation rules
		if (_isPublic) {
			makePublic(id);
		} else {
			makePrivate(id);
		}
		// step 4: set divisibility rules
		if (_isDivisible) {
			makeDivisible(id);
		} else {
			makeNotDivisible(id);
		}
		// step 5: set weight
		if (_weight != 0) {
			setWeight(id, _weight);
		}
	}

	/**
    This method creates child asset
    */
	function create(
		uint256 _pid,
		bool _isPublic,
		bool _isDivisible,
		uint256 _weight
	) public parentAllowed(_pid) {
		// step 1: get id of new asset from nonce
		uint256 id = generateNewId();
		// step 2: mint new token
		_mint(msg.sender, id, 1, '');
		// step 3: set parent id
		setParent(id, _pid);
		// step 4: set parent derivation access
		if (_isPublic) {
			makePublic(id);
		} else {
			makePrivate(id);
		}
		// step 5: set divisibility rules
		if (_isDivisible) {
			makeDivisible(id);
		} else {
			makeNotDivisible(id);
		}
		// step 5: set weight
		setWeight(id, _weight);
	}

	function send(address _to, uint256 _id) public {
		safeTransferFrom(msg.sender, _to, _id, 1, '');
	}

	function sendFrom(
		address _from,
		address _to,
		uint256 _id
	) public {
		safeTransferFrom(_from, _to, _id, 1, '');
	}

	// ========= PARENTABLE

	/*
    mapping to store list of addresses for each asset
    which can use asset as parent

    if asset id has zero address -> true -- asset is public,
    meaning that any can use it as parent

    else user can set allowed addresses during creation of asset
    note: user can add it's own address to disallow anyone
    use asset as parent
    */
	mapping(uint256 => mapping(address => bool)) private derivationRules;

	// map of asset's parent
	mapping(uint256 => uint256) private parentIds;

	function makePublic(uint256 _id) public override onlyAssetOwner(_id) {
		derivationRules[_id][address(0)] = true;
	}

	function makePrivate(uint256 _id) public override onlyAssetOwner(_id) {
		derivationRules[_id][address(0)] = false;
	}

	function allow(address _address, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		derivationRules[_id][_address] = true;
	}

	function allowBatch(address[] memory _addresses, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		for (uint256 i = 0; i < _addresses.length; i++) {
			allow(_addresses[i], _id);
		}
	}

	function disallow(address _address, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		derivationRules[_id][_address] = false;
	}

	function disallowBatch(address[] memory _addresses, uint256 _id)
		public
		override
		onlyAssetOwner(_id)
	{
		for (uint256 i = 0; i < _addresses.length; i++) {
			disallow(_addresses[i], _id);
		}
	}

	function setParent(uint256 id, uint256 pid) internal {
		parentIds[id] = pid;
	}

	function getParentID(uint256 _id) public view override returns (uint256) {
		return parentIds[_id];
	}

	/**
        modifier to determine whether msg.sender is allowed
        to use asset as parent
        @param _pid - parent id
     */
	modifier parentAllowed(uint256 _pid) {
		require(
			isPublic(_pid) || isAllowed(_pid, msg.sender),
			'Can not create new asset, based on selected as parent'
		);
		_;
	}

	modifier onlyAssetOwner(uint256 _id) {
		require(balanceOf(msg.sender, _id) > 0, 'Not owner');
		_;
	}

	function isPublic(uint256 id) public view override returns (bool) {
		return derivationRules[id][address(0)] == true;
	}

	function isAllowed(uint256 id, address requester)
		public
		view
		override
		returns (bool)
	{
		return derivationRules[id][requester] == true;
	}

	//================= Licensable

	// mapping to store expiration date of each licence
	mapping(uint256 => uint256) expirationDates;

	function generateNewLicenceId() internal returns (uint256) {
		return ++nonce | LICENCE_BIT;
	}

	function createLicence(
		uint256 _pid,
		address _to,
		uint256 _expirationDate
	) public override parentAllowed(_pid) returns (uint256) {
		// step 1: get id of new asset from nonce
		uint256 id = generateNewLicenceId();
		// step 2: mint new token
		_mint(_to, id, 1, '');
		// step 3: set parent id
		setParent(id, _pid);
		// step 4: set expiration date
		setExpiration(id, _expirationDate);

		return id;
	}

	// The top bit is a flag to tell if this is a licence
	uint256 constant LICENCE_BIT = 1 << 255;

	function isLicence(uint256 _id) public pure override returns (bool) {
		return _id & LICENCE_BIT == LICENCE_BIT;
	}

	function setExpiration(uint256 _id, uint256 expirationDate) internal {
		// pass expirationDate zero to set lifetime licence
		expirationDates[_id] = expirationDate;
	}

	function getExpiration(uint256 _id)
		external
		view
		override
		returns (uint256)
	{
		return expirationDates[_id];
	}

	function licenceOf(uint256 _id) public view override returns (uint256) {
		if (isLicence(_id)) {
			return getParentID(_id);
		} else {
			return 0;
		}
	}

	//================= Divisible
	mapping(uint256 => bool) private divisibilityRules;
	mapping(uint256 => uint256) private divisionParentIDs;
	mapping(uint256 => uint256) private weightMap;

	function makeDivisible(uint256 _id) public override onlyAssetOwner(_id) {
		divisibilityRules[_id] = true;
	}

	function makeNotDivisible(uint256 _id) public override onlyAssetOwner(_id) {
		divisibilityRules[_id] = false;
	}

	function isDivisible(uint256 _id)
		public
		view
		override
		returns (bool _isDivisible)
	{
		return divisibilityRules[_id];
	}

	function getWeight(uint256 _id)
		public
		view
		override
		returns (uint256 weight)
	{
		return weightMap[_id];
	}

	function setWeight(uint256 _id, uint256 _weight)
		public
		override
		onlyAssetOwner(_id)
	{
		weightMap[_id] = _weight;
	}

	function divisionOf(uint256 _id)
		public
		view
		override
		returns (uint256 divID)
	{
		return divisionParentIDs[_id];
	}

	event Divide(uint256[] listOfIDs);

	function stepDivideInto(
		uint256 _id,
		uint256 _stepNum,
		uint256 _stepSize
	) public override onlyAssetOwner(_id) returns (uint256[] memory mintedIDs) {
		// require that step size * step num is <= asset's weight
		require(
			_stepSize * _stepNum <= weightMap[_id],
			'Required weight exceeds asset weight'
		);
		// require that asset is allowed to be divisible
		require(
			divisibilityRules[_id] == true,
			'Asset has divisibility disabled'
		);

		uint256[] memory _ids = new uint256[](_stepNum);
		uint256[] memory _sizes = new uint256[](_stepNum);

		// step 1: generate and save ids for new assets
		for (uint256 i = 0; i < _stepNum; i++) {
			_ids[i] = generateNewId();
		}
		// step 2: create a size array for _mintBatch
		for (uint256 i = 0; i < _stepNum; i++) {
			_sizes[i] = 1;
		}
		// step 3: batch mint new tokens
		_mintBatch(msg.sender, _ids, _sizes, '');
		// step 4: set tokens' division parent IDs
		for (uint256 i = 0; i < _stepNum; i++) {
			divisionParentIDs[_ids[i]] = _id;
		}
		// step 4: set the correct weight for the minted tokens
		for (uint256 i = 0; i < _stepNum; i++) {
			weightMap[_ids[i]] = _stepSize;
		}
		// step 5: remove the weight from original asset
		weightMap[_id] -= _stepSize * _stepNum;

		// step 6: correctly map created tokens to their parent
		for (uint256 i = 0; i < _stepNum; i++) {
			parentIds[_ids[i]] = _id;
		}

		// emit an event with values
		emit Divide(_ids);

		// return ids of minted tokens
		return _ids;
	}
}
