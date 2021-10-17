import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol';

// import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract SpacePayloadAsset is ERC1155Pausable {
	address public owner;
	uint256 private nonce;
	uint256 public constant decimals = 18;

	function generateNewId() internal returns (uint256) {
		return ++nonce;
	}

	constructor(string memory uri) ERC1155(uri) {}

	modifier onlyOwner() {
		require(msg.sender == owner, 'Not admin');
		_;
	}

	modifier onlyAssetOwner(uint256 _id) {
		require(balanceOf(msg.sender, _id) > 0, 'Not owner');
		_;
	}

	event AssetCreation(address _to, uint256 _id, uint256 _amount);

	event Transfer(address _to, uint256 _id, uint256 _amount);

	event TransferFrom(address _from, address _to, uint256 _id, uint256 _amount);

	function send(
		address _to,
		uint256 _id,
		uint256 _amount
	) public whenNotPaused() {
		require(balanceOf(msg.sender, _id) >= _amount, 'Insufficient balance');
		safeTransferFrom(msg.sender, _to, _id, _amount, '');
		emit Transfer(_to, _id, _amount);
	}

	function sendFrom(
		address _from,
		address _to,
		uint256 _id,
		uint256 _amount
	) public whenNotPaused() {
		require(balanceOf(_from, _id) >= _amount, 'Insufficient balance');
		require(
			isApprovedForAll(_from, msg.sender),
			'Required operator is not approved by owner'
		);
		safeTransferFrom(_from, _to, _id, _amount, '');
		emit TransferFrom(_from, _to, _id, _amount);
	}

	function createAsset(uint256 _grams) external {
		uint256 id = generateNewId();
		uint256 amount = _grams * 10**decimals;
		_mint(msg.sender, id, amount, '');
		_pause();

		emit AssetCreation(msg.sender, id, amount);
	}

	function pauseAsset(uint256 _id) external onlyAssetOwner(_id) {
		_pause();
	}

	function unpauseAsset(uint256 _id) external onlyAssetOwner(_id) {
		_unpause();
	}
}
