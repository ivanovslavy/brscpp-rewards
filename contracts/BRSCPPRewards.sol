// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BRSCPPRewards
 * @notice Bounty system with native/ERC20 support and time-based claim windows
 */
contract BRSCPPRewards is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // ============================================
    // TYPES & STATE
    // ============================================
    
    enum Category { TECHNICAL, MARKETING }
    
    struct Bounty {
        uint256 amount;
        address winner;
        bool claimed;
    }
    
    bool public initialized;
    bool public isNativeToken;
    address public tokenAddress;
    uint256 public deadline;
    uint256 public claimDeadline;
    
    mapping(Category => Bounty) public bounties;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event BountyInitialized(bool isNative, address token, uint256 deadline);
    event FundsDeposited(uint256 technicalAmount, uint256 marketingAmount);
    event WinnerSet(Category indexed category, address indexed winner);
    event BountyClaimed(Category indexed category, address indexed winner, uint256 amount);
    event UnclaimedWithdrawn(Category indexed category, uint256 amount);
    
    // ============================================
    // CONSTRUCTOR & RECEIVE
    // ============================================
    
    constructor() Ownable(msg.sender) {}
    
    receive() external payable {
        revert("Use depositFunds()");
    }
    
    fallback() external payable {
        revert("Use depositFunds()");
    }
    
    // ============================================
    // CONFIGURATION (OWNER ONLY)
    // ============================================
    
    /**
     * @notice Initialize bounty parameters (called once)
     * @param _isNativeToken true for ETH/BNB, false for ERC20
     * @param _tokenAddress ERC20 token address (zero address if native)
     * @param _deadline Contest end timestamp
     */
    function initialize(
        bool _isNativeToken,
        address _tokenAddress,
        uint256 _deadline
    ) external onlyOwner {
        require(!initialized, "Already initialized");
        require(_deadline > block.timestamp, "Invalid deadline");
        
        if (!_isNativeToken) {
            require(_tokenAddress != address(0), "Invalid token");
        }
        
        initialized = true;
        isNativeToken = _isNativeToken;
        tokenAddress = _tokenAddress;
        deadline = _deadline;
        claimDeadline = _deadline + 30 days;
        
        emit BountyInitialized(_isNativeToken, _tokenAddress, _deadline);
    }
    
    /**
     * @notice Deposit bounty funds (called once)
     * @param _technicalAmount Amount for technical category
     * @param _marketingAmount Amount for marketing category
     */
    function depositFunds(
        uint256 _technicalAmount,
        uint256 _marketingAmount
    ) external payable onlyOwner nonReentrant {
        require(initialized, "Not initialized");
        require(bounties[Category.TECHNICAL].amount == 0, "Already deposited");
        require(_technicalAmount > 0 && _marketingAmount > 0, "Invalid amounts");
        
        if (isNativeToken) {
            require(msg.value == _technicalAmount + _marketingAmount, "Wrong amount");
        } else {
            require(msg.value == 0, "No ETH for ERC20");
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                _technicalAmount + _marketingAmount
            );
        }
        
        bounties[Category.TECHNICAL].amount = _technicalAmount;
        bounties[Category.MARKETING].amount = _marketingAmount;
        
        emit FundsDeposited(_technicalAmount, _marketingAmount);
    }
    
    /**
     * @notice Set category winner (before deadline)
     * @param _category TECHNICAL or MARKETING
     * @param _winner Winner address
     */
    function setWinner(Category _category, address _winner) external onlyOwner {
        require(initialized, "Not initialized");
        require(_winner != address(0), "Invalid winner");
        require(bounties[_category].winner == address(0), "Winner set");
        require(block.timestamp <= deadline, "Deadline passed");
        
        bounties[_category].winner = _winner;
        emit WinnerSet(_category, _winner);
    }
    
    // ============================================
    // CLAIM (WINNERS ONLY)
    // ============================================
    
    /**
     * @notice Claim bounty reward (winner only, after deadline, before claimDeadline)
     * @param _category TECHNICAL or MARKETING
     */
    function claimBounty(Category _category) external nonReentrant {
        Bounty storage bounty = bounties[_category];
        
        require(msg.sender == bounty.winner, "Not winner");
        require(!bounty.claimed, "Already claimed");
        require(block.timestamp > deadline, "Contest active");
        require(block.timestamp <= claimDeadline, "Claim expired");
        
        bounty.claimed = true;
        
        if (isNativeToken) {
            (bool success, ) = payable(msg.sender).call{value: bounty.amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(tokenAddress).safeTransfer(msg.sender, bounty.amount);
        }
        
        emit BountyClaimed(_category, msg.sender, bounty.amount);
    }
    
    // ============================================
    // WITHDRAWAL (OWNER ONLY)
    // ============================================
    
    /**
     * @notice Withdraw unclaimed bounty (owner only, after claimDeadline)
     * @param _category TECHNICAL or MARKETING
     * @param _recipient Withdrawal recipient address
     */
    function withdrawUnclaimed(
        Category _category,
        address _recipient
    ) external onlyOwner nonReentrant {
        Bounty storage bounty = bounties[_category];
        
        require(_recipient != address(0), "Invalid recipient");
        require(!bounty.claimed, "Already claimed");
        require(block.timestamp > claimDeadline, "Claim period active");
        
        uint256 amount = bounty.amount;
        bounty.claimed = true;
        
        if (isNativeToken) {
            (bool success, ) = payable(_recipient).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(tokenAddress).safeTransfer(_recipient, amount);
        }
        
        emit UnclaimedWithdrawn(_category, amount);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get bounty information
     * @param _category TECHNICAL or MARKETING
     * @return amount Bounty amount
     * @return winner Winner address
     * @return claimed Claim status
     * @return canClaim If winner can claim now
     * @return canWithdraw If owner can withdraw now
     */
    function getBountyInfo(Category _category) external view returns (
        uint256 amount,
        address winner,
        bool claimed,
        bool canClaim,
        bool canWithdraw
    ) {
        Bounty memory bounty = bounties[_category];
        
        bool _canClaim = bounty.winner != address(0) 
            && !bounty.claimed 
            && block.timestamp > deadline 
            && block.timestamp <= claimDeadline;
            
        bool _canWithdraw = !bounty.claimed && block.timestamp > claimDeadline;
        
        return (
            bounty.amount,
            bounty.winner,
            bounty.claimed,
            _canClaim,
            _canWithdraw
        );
    }
    
    /**
     * @notice Get contest configuration
     * @return _initialized Initialization status
     * @return _isNativeToken Native or ERC20 token
     * @return _tokenAddress Token address (zero if native)
     * @return _deadline Contest deadline
     * @return _claimDeadline Claim deadline
     * @return _timeUntilDeadline Seconds until contest ends
     * @return _timeUntilClaimDeadline Seconds until claim expires
     */
    function getContestInfo() external view returns (
        bool _initialized,
        bool _isNativeToken,
        address _tokenAddress,
        uint256 _deadline,
        uint256 _claimDeadline,
        uint256 _timeUntilDeadline,
        uint256 _timeUntilClaimDeadline
    ) {
        uint256 timeUntilDeadline = block.timestamp < deadline 
            ? deadline - block.timestamp 
            : 0;
            
        uint256 timeUntilClaimDeadline = block.timestamp < claimDeadline 
            ? claimDeadline - block.timestamp 
            : 0;
        
        return (
            initialized,
            isNativeToken,
            tokenAddress,
            deadline,
            claimDeadline,
            timeUntilDeadline,
            timeUntilClaimDeadline
        );
    }
}
