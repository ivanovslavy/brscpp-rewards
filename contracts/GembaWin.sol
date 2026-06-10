// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title GembaWin
 * @notice A bounty / rewards contest with a configurable number of prize positions.
 *         Clone-friendly (initialize-based) so a GembaWinFactory can deploy many
 *         instances cheaply via EIP-1167 minimal proxies.
 *
 * LIFECYCLE:
 *  - The factory clones this template and calls initialize(...) in the SAME tx; the
 *    bounty creator becomes the owner.
 *  - Owner funds every position once (depositFunds), names a winner per position before
 *    the deadline (setWinner), winners claim after the deadline within CLAIM_PERIOD
 *    (claimBounty), and the owner recovers anything unclaimed afterwards (withdrawUnclaimed).
 *
 * Positions are plain indices 0..positionCount-1 (no fixed categories). Native (GMB/ETH)
 * or any ERC-20 prize. Bare value transfers are rejected.
 */
contract GembaWin is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========
    string public constant VERSION = "1.0.0";
    uint256 public constant CLAIM_PERIOD = 30 days;
    uint256 public constant MAX_POSITIONS = 50;

    // ========== TYPES & STATE ==========
    struct Bounty {
        uint256 amount;
        address winner;
        bool claimed;
    }

    address public owner;
    string public name;
    bool public initialized;
    bool public funded;
    bool public isNativeToken;
    address public tokenAddress;
    uint256 public deadline;
    uint256 public claimDeadline;
    uint256 public positionCount;

    mapping(uint256 => Bounty) public bounties;

    // ========== EVENTS ==========
    event Initialized(address indexed owner, string name, uint256 positionCount, bool isNative, address token, uint256 deadline);
    event FundsDeposited(uint256 total, uint256[] amounts);
    event WinnerSet(uint256 indexed position, address indexed winner);
    event BountyClaimed(uint256 indexed position, address indexed winner, uint256 amount);
    event UnclaimedWithdrawn(uint256 indexed position, address indexed recipient, uint256 amount);

    // ========== MODIFIERS ==========
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ========== CONSTRUCTOR & FALLBACKS ==========
    constructor() {} // template only — clones never run this

    receive() external payable { revert("Use depositFunds()"); }
    fallback() external payable { revert("Use depositFunds()"); }

    // ========== INITIALIZATION (clone-friendly) ==========

    /**
     * @notice One-time setup. Called by the factory right after cloning (same tx).
     * @param _owner The bounty owner (the creator).
     * @param _name Human-readable contest name.
     * @param _isNativeToken true for native GMB/ETH, false for an ERC-20.
     * @param _tokenAddress ERC-20 address (ignored when native).
     * @param _deadline Contest end timestamp (must be in the future).
     * @param _positionCount Number of prize positions (1..MAX_POSITIONS).
     */
    function initialize(
        address _owner,
        string calldata _name,
        bool _isNativeToken,
        address _tokenAddress,
        uint256 _deadline,
        uint256 _positionCount
    ) external {
        require(!initialized, "Already initialized");
        require(_owner != address(0), "Invalid owner");
        require(bytes(_name).length > 0, "Name required");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_positionCount >= 1 && _positionCount <= MAX_POSITIONS, "Positions 1-50");

        if (!_isNativeToken) {
            require(_tokenAddress != address(0), "Invalid token");
            require(_tokenAddress.code.length > 0, "Token not a contract");
        }

        initialized = true;
        owner = _owner;
        name = _name;
        isNativeToken = _isNativeToken;
        tokenAddress = _tokenAddress;
        deadline = _deadline;
        claimDeadline = _deadline + CLAIM_PERIOD;
        positionCount = _positionCount;

        emit Initialized(_owner, _name, _positionCount, _isNativeToken, _tokenAddress, _deadline);
    }

    // ========== OWNER CONFIGURATION ==========

    /**
     * @notice Fund every position once. amounts.length must equal positionCount.
     * @param _amounts Prize amount per position (each > 0).
     */
    function depositFunds(uint256[] calldata _amounts) external payable onlyOwner nonReentrant {
        require(initialized, "Not initialized");
        require(!funded, "Already deposited");
        require(_amounts.length == positionCount, "Amounts != positions");

        uint256 total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Invalid amount");
            total += _amounts[i];
        }

        if (isNativeToken) {
            require(msg.value == total, "Wrong amount");
        } else {
            require(msg.value == 0, "No ETH for ERC20");
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), total);
        }

        funded = true;
        for (uint256 i = 0; i < _amounts.length; i++) {
            bounties[i].amount = _amounts[i];
        }

        emit FundsDeposited(total, _amounts);
    }

    /**
     * @notice Set the winner for a position (before the deadline).
     * @param _position Position index (< positionCount).
     * @param _winner Winner address.
     */
    function setWinner(uint256 _position, address _winner) external onlyOwner {
        require(initialized, "Not initialized");
        require(_position < positionCount, "Invalid position");
        require(_winner != address(0), "Invalid winner");
        require(bounties[_position].winner == address(0), "Winner set");
        require(block.timestamp <= deadline, "Deadline passed");

        bounties[_position].winner = _winner;
        emit WinnerSet(_position, _winner);
    }

    // ========== CLAIM (WINNERS) ==========

    /**
     * @notice Winner claims a position's prize (after deadline, before claimDeadline).
     * @param _position Position index.
     */
    function claimBounty(uint256 _position) external nonReentrant {
        require(_position < positionCount, "Invalid position");
        Bounty storage bounty = bounties[_position];

        require(msg.sender == bounty.winner, "Not winner");
        require(!bounty.claimed, "Already claimed");
        require(block.timestamp > deadline, "Contest active");
        require(block.timestamp <= claimDeadline, "Claim expired");

        bounty.claimed = true;
        uint256 amount = bounty.amount;

        if (isNativeToken) {
            Address.sendValue(payable(msg.sender), amount);
        } else {
            IERC20(tokenAddress).safeTransfer(msg.sender, amount);
        }

        emit BountyClaimed(_position, msg.sender, amount);
    }

    // ========== OWNER RECOVERY ==========

    /**
     * @notice Owner withdraws an unclaimed prize (after claimDeadline).
     * @param _position Position index.
     * @param _recipient Recipient of the unclaimed prize.
     */
    function withdrawUnclaimed(uint256 _position, address _recipient) external onlyOwner nonReentrant {
        require(_position < positionCount, "Invalid position");
        Bounty storage bounty = bounties[_position];

        require(_recipient != address(0), "Invalid recipient");
        require(!bounty.claimed, "Already claimed");
        require(block.timestamp > claimDeadline, "Claim period active");

        uint256 amount = bounty.amount;
        bounty.claimed = true;

        if (isNativeToken) {
            Address.sendValue(payable(_recipient), amount);
        } else {
            IERC20(tokenAddress).safeTransfer(_recipient, amount);
        }

        emit UnclaimedWithdrawn(_position, _recipient, amount);
    }

    // ========== VIEWS ==========

    function getBountyInfo(uint256 _position) external view returns (
        uint256 amount, address winner, bool claimed, bool canClaim, bool canWithdraw
    ) {
        require(_position < positionCount, "Invalid position");
        Bounty memory b = bounties[_position];
        uint256 _deadline = deadline;
        uint256 _claimDeadline = claimDeadline;

        bool _canClaim = b.winner != address(0) && !b.claimed
            && block.timestamp > _deadline && block.timestamp <= _claimDeadline;
        bool _canWithdraw = !b.claimed && b.amount > 0 && block.timestamp > _claimDeadline;

        return (b.amount, b.winner, b.claimed, _canClaim, _canWithdraw);
    }

    function getContestInfo() external view returns (
        address _owner,
        string memory _name,
        bool _initialized,
        bool _funded,
        bool _isNativeToken,
        address _tokenAddress,
        uint256 _deadline,
        uint256 _claimDeadline,
        uint256 _positionCount,
        uint256 _timeUntilDeadline,
        uint256 _timeUntilClaimDeadline
    ) {
        uint256 td = block.timestamp < deadline ? deadline - block.timestamp : 0;
        uint256 tc = block.timestamp < claimDeadline ? claimDeadline - block.timestamp : 0;
        return (
            owner, name, initialized, funded, isNativeToken, tokenAddress,
            deadline, claimDeadline, positionCount, td, tc
        );
    }

    /// @notice All prize amounts and winners, indexed by position.
    function getAllPositions() external view returns (uint256[] memory amounts, address[] memory winners, bool[] memory claimedFlags) {
        amounts = new uint256[](positionCount);
        winners = new address[](positionCount);
        claimedFlags = new bool[](positionCount);
        for (uint256 i = 0; i < positionCount; i++) {
            amounts[i] = bounties[i].amount;
            winners[i] = bounties[i].winner;
            claimedFlags[i] = bounties[i].claimed;
        }
    }
}
