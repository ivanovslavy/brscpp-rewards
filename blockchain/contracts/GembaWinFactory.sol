// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./GembaWin.sol";

/**
 * @title GembaWinFactory
 * @notice Deploys GembaWin bounty contests as EIP-1167 minimal-proxy clones for a small
 *         fee. Mirrors the proven RealEstateFactory pattern. Creation is PERMISSIONLESS:
 *         anyone may create a contest (paying the deploy fee) and becomes its owner.
 *         Admin roles only manage the fee, template, pause and fee withdrawal.
 */
contract GembaWinFactory is AccessControlEnumerable, ReentrancyGuard {
    // ========== CONSTANTS ==========
    string public constant VERSION = "1.0.0";
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ========== STRUCTS ==========
    struct BountyParams {
        string name;
        bool isNativeToken;
        address tokenAddress;
        uint256 deadlineDays;   // 1..365
        uint256 positionCount;  // 1..GembaWin.MAX_POSITIONS
    }

    struct BountyRecord {
        address contractAddress;
        address creator;
        string name;
        bool isNativeToken;
        address tokenAddress;
        uint256 deadline;
        uint256 positionCount;
        uint256 deployedAt;
        bool isActive;
    }

    struct FactoryStats {
        uint256 totalContracts;
        uint256 activeContracts;
        uint256 completedContracts;
        uint256 totalValueLocked;
        uint256 deployFee;
        uint256 collectedFees;
        bool isPaused;
        address templateContract;
    }

    // ========== STATE ==========
    address public templateContract;
    uint256 public deployFee;
    uint256 public collectedFees;

    mapping(uint256 => BountyRecord) public bounties;
    mapping(address => uint256[]) public bountiesByCreator;
    uint256 public totalContracts;
    uint256 public activeContracts;
    bool public factoryPaused;

    /// @notice Prize tokens accepted for ERC-20 contests (native GMB is always allowed).
    mapping(address => bool) public supportedToken;

    /// @notice keccak256(orderId) => used. A GembaPay order funds only ONE contest
    /// (on-chain anti double-spend; empty orderId = free direct deploy, no check).
    mapping(bytes32 => bool) public usedOrder;

    // ========== EVENTS ==========
    event BountyCreated(uint256 indexed contractId, address indexed contractAddress, address indexed creator, string name, uint256 positionCount, uint256 deployFeePaid);
    event TemplateUpdated(address indexed oldTemplate, address indexed newTemplate);
    event DeployFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event FactoryPaused(bool paused);
    event AdminAdded(address indexed admin, address indexed addedBy);
    event AdminRemoved(address indexed admin, address indexed removedBy);
    event ContractStatusUpdated(uint256 indexed contractId, bool isActive);
    event TokenSupportUpdated(address indexed token, bool supported);

    // ========== MODIFIERS ==========
    modifier whenNotPaused() {
        require(!factoryPaused, "Factory is paused");
        _;
    }
    modifier templateSet() {
        require(templateContract != address(0), "Template not set");
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor(address _owner, address _templateContract, uint256 _deployFee) {
        require(_owner != address(0), "Invalid owner address");
        require(
            _templateContract == address(0) || _templateContract.code.length > 0,
            "Template must be a contract"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        templateContract = _templateContract;
        deployFee = _deployFee;

        emit AdminAdded(_owner, address(0));
        if (_templateContract != address(0)) emit TemplateUpdated(address(0), _templateContract);
    }

    // ========== CREATE (PERMISSIONLESS) ==========

    /**
     * @notice Create a new GembaWin bounty contest. Anyone may call (pays deployFee).
     *         The caller becomes the owner of the new contest.
     * @param params Contest configuration (name, token, deadlineDays, positionCount).
     * @return contractId Sequential id of the new contest.
     * @return contractAddress Address of the deployed clone.
     */
    function createBounty(BountyParams calldata params, string calldata orderId)
        external
        payable
        whenNotPaused
        templateSet
        nonReentrant
        returns (uint256 contractId, address contractAddress)
    {
        // One paid GembaPay order = one contest (prevents reusing a payment).
        if (bytes(orderId).length > 0) {
            bytes32 oid = keccak256(bytes(orderId));
            require(!usedOrder[oid], "Order already used");
            usedOrder[oid] = true;
        }
        require(msg.value >= deployFee, "Insufficient deploy fee");
        _validateParams(params);
        if (!params.isNativeToken) require(supportedToken[params.tokenAddress], "Unsupported token");

        if (deployFee > 0) collectedFees += deployFee;
        uint256 excess = msg.value - deployFee;

        contractId = totalContracts;
        totalContracts++;
        contractAddress = _cloneContract(templateContract);

        uint256 deadlineTs = block.timestamp + params.deadlineDays * 1 days;

        bounties[contractId] = BountyRecord({
            contractAddress: contractAddress,
            creator: msg.sender,
            name: params.name,
            isNativeToken: params.isNativeToken,
            tokenAddress: params.tokenAddress,
            deadline: deadlineTs,
            positionCount: params.positionCount,
            deployedAt: block.timestamp,
            isActive: true
        });
        bountiesByCreator[msg.sender].push(contractId);
        activeContracts++;

        emit BountyCreated(contractId, contractAddress, msg.sender, params.name, params.positionCount, deployFee);

        // Initialize the clone (same tx as the clone creation → no front-run window).
        bytes memory initData = abi.encodeCall(
            GembaWin.initialize,
            (msg.sender, params.name, params.isNativeToken, params.tokenAddress, deadlineTs, params.positionCount)
        );
        (bool success, ) = contractAddress.call(initData);
        require(success, "Initialization failed");

        if (excess > 0) Address.sendValue(payable(msg.sender), excess);

        return (contractId, contractAddress);
    }

    function _validateParams(BountyParams calldata params) private pure {
        require(bytes(params.name).length > 0, "Empty name");
        require(params.deadlineDays > 0 && params.deadlineDays <= 365, "Deadline 1-365 days");
        require(params.positionCount >= 1 && params.positionCount <= 50, "Positions 1-50");
        if (!params.isNativeToken) {
            require(params.tokenAddress != address(0), "Invalid token");
        }
    }

    function _cloneContract(address _template) private returns (address clone) {
        bytes32 salt = keccak256(abi.encodePacked(totalContracts, block.timestamp, msg.sender));
        bytes memory bytecode = abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            _template,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
        assembly {
            clone := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(clone != address(0), "Clone failed");
    }

    // ========== ADMIN ==========

    function setTemplateContract(address _templateContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_templateContract != address(0), "Invalid template address");
        require(_templateContract.code.length > 0, "Template must be a contract");
        address old = templateContract;
        templateContract = _templateContract;
        emit TemplateUpdated(old, _templateContract);
    }

    function setDeployFee(uint256 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = deployFee;
        deployFee = _newFee;
        emit DeployFeeUpdated(old, _newFee);
    }

    /// @notice Allow/disallow an ERC-20 as a prize token (native GMB is always allowed).
    function setSupportedToken(address token, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Invalid token");
        supportedToken[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function withdrawFees(address _recipient) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(_recipient != address(0), "Invalid recipient");
        require(collectedFees > 0, "No fees to withdraw");
        uint256 amount = collectedFees;
        collectedFees = 0;
        emit FeesWithdrawn(_recipient, amount);
        Address.sendValue(payable(_recipient), amount);
    }

    function pauseFactory(bool _paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        factoryPaused = _paused;
        emit FactoryPaused(_paused);
    }

    function addAdmin(address _admin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_admin != address(0), "Invalid admin");
        require(!hasRole(ADMIN_ROLE, _admin), "Already admin");
        _grantRole(ADMIN_ROLE, _admin);
        emit AdminAdded(_admin, msg.sender);
    }

    function removeAdmin(address _admin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(ADMIN_ROLE, _admin), "Not admin");
        _revokeRole(ADMIN_ROLE, _admin);
        emit AdminRemoved(_admin, msg.sender);
    }

    function markContractInactive(uint256 _contractId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_contractId < totalContracts, "Contract not exist");
        require(bounties[_contractId].isActive, "Already inactive");
        bounties[_contractId].isActive = false;
        activeContracts--;
        emit ContractStatusUpdated(_contractId, false);
    }

    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 withdrawable = address(this).balance - collectedFees;
        require(withdrawable > 0, "No funds");
        Address.sendValue(payable(msg.sender), withdrawable);
    }

    // ========== VIEWS ==========

    function getFactoryStats() external view returns (FactoryStats memory) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < totalContracts; i++) {
            if (bounties[i].isActive) totalValue += bounties[i].contractAddress.balance;
        }
        return FactoryStats({
            totalContracts: totalContracts,
            activeContracts: activeContracts,
            completedContracts: totalContracts - activeContracts,
            totalValueLocked: totalValue,
            deployFee: deployFee,
            collectedFees: collectedFees,
            isPaused: factoryPaused,
            templateContract: templateContract
        });
    }

    function getLatestContracts(uint256 _limit) external view returns (BountyRecord[] memory) {
        require(_limit > 0 && _limit <= 20, "Limit 1-20");
        uint256 returnSize = _limit < totalContracts ? _limit : totalContracts;
        BountyRecord[] memory list = new BountyRecord[](returnSize);
        for (uint256 i = 0; i < returnSize; i++) {
            list[i] = bounties[totalContracts - 1 - i];
        }
        return list;
    }

    function getActiveContracts(uint256 _offset, uint256 _limit)
        external
        view
        returns (BountyRecord[] memory, bool, uint256)
    {
        require(_limit > 0 && _limit <= 50, "Limit 1-50");
        uint256 activeFound = 0;
        for (uint256 i = 0; i < totalContracts; i++) {
            if (bounties[i].isActive) activeFound++;
        }
        if (_offset >= activeFound || activeFound == 0) {
            return (new BountyRecord[](0), false, activeFound);
        }
        uint256 returnSize = _limit;
        if (_offset + _limit > activeFound) returnSize = activeFound - _offset;

        BountyRecord[] memory list = new BountyRecord[](returnSize);
        uint256 resultIndex = 0;
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalContracts && resultIndex < returnSize; i++) {
            if (bounties[i].isActive) {
                if (currentIndex >= _offset) {
                    list[resultIndex] = bounties[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }
        return (list, (_offset + returnSize) < activeFound, activeFound);
    }

    function getContract(uint256 _contractId) external view returns (BountyRecord memory) {
        require(_contractId < totalContracts, "Contract not exist");
        return bounties[_contractId];
    }

    function getContractsByCreator(address _creator) external view returns (uint256[] memory) {
        return bountiesByCreator[_creator];
    }

    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }

    function isOwner(address _account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _account);
    }

    receive() external payable {}
}
