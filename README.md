# BRSCPP Rewards - Bounty System Smart Contract

Professional bounty reward system with native token (ETH/BNB) and ERC20 (USDT/USDC) support, featuring time-based claim windows and secure fund recovery.

## Features

- **Dual Token Support**: Native tokens (ETH/BNB) or ERC20 stablecoins (USDT/USDC)
- **Two Reward Categories**: Technical and Marketing bounties
- **Time-Based Claims**: 30-day claim window after contest deadline
- **Fund Recovery**: Owner can recover unclaimed funds after claim period expires
- **Security**: ReentrancyGuard, access controls, single initialization
- **Audited**: Clean Slither security audit results

## Timeline
```
Contest Active → Deadline → Claim Period (30 days) → Owner Withdrawal
     ↓              ↓              ↓                        ↓
Set winners    Winners can    Winners can still        Owner can withdraw
               NOT claim      claim rewards            unclaimed funds
```

## Smart Contract Flow

1. **Initialize**: Set token type (native/ERC20), deadline (once only)
2. **Deposit Funds**: Owner deposits bounty amounts (once only)
3. **Set Winners**: Owner assigns winner addresses (before deadline)
4. **Claim Period**: Winners claim rewards (after deadline, 30 days)
5. **Recovery**: Owner withdraws unclaimed funds (after claim deadline)

## Installation (Ubuntu/Linux)

### Prerequisites
```bash
# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Install Git
sudo apt-get install git
```

### Project Setup
```bash
# Clone repository
git clone https://github.com/yourusername/brscpp-rewards.git
cd brscpp-rewards/blockchain

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Configuration

### 1. Create Environment File
```bash
cp .env.example .env
nano .env
```

### 2. Configure .env
```env
# Main account (owner)
PRIVATE_KEY=your_private_key_without_0x

# Test accounts (for testing)
PRIVATE_KEY_TECHNICAL=technical_winner_private_key
PRIVATE_KEY_MARKETING=marketing_winner_private_key
PRIVATE_KEY_OTHER=other_test_account_private_key

# Infura API (for Ethereum/Sepolia)
INFURA_API_KEY=your_infura_project_id

# Etherscan API (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# BSC/Polygon APIs (optional)
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 3. Get Required Keys

**Private Key** (from MetaMask):
- Settings → Security & Privacy → Show Private Key
- Copy WITHOUT `0x` prefix
- ⚠️ Use TEST wallet only!

**Infura API Key**:
1. Visit https://infura.io
2. Create account → New Project → Web3 API
3. Copy PROJECT ID

**Etherscan API Key**:
1. Visit https://etherscan.io
2. Sign up → My Profile → API Keys
3. Add → Create New API Key

**Sepolia Testnet ETH**:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- Need ~0.5 ETH for testing

## Deployment

### Local Development
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy to localhost
npm run deploy:localhost
```

### Sepolia Testnet
```bash
# Check environment configuration
npx hardhat run scripts/check-env.js --network sepolia

# Deploy to Sepolia
npm run deploy:sepolia

# Verify contract (after deployment)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Other Networks
```bash
npm run deploy:bsc-testnet  # BSC Testnet
npm run deploy:amoy         # Polygon Amoy Testnet
npm run deploy:mainnet      # Ethereum Mainnet
npm run deploy:bsc          # BSC Mainnet
npm run deploy:polygon      # Polygon Mainnet
```

## Testing

### Run Full Test Suite
```bash
# Localhost (uses time manipulation)
npm run test:rewards

# Sepolia (real network, waits 60s)
npm run test:sepolia
```

### Test Output

Test results are saved to `deployed/TEST_<timestamp>_<network>.json`

Example test flow:
1. Deploy fresh contract
2. Initialize with 60s deadline
3. Deposit 0.1 ETH for each category
4. Set winner addresses
5. Test claim rejection before deadline ✅
6. Test owner withdrawal rejection before claim deadline ✅
7. Wait for deadline to pass
8. Test successful claims ✅
9. Test double claim rejection ✅
10. Test unauthorized claim rejection ✅

## Security Audit
```bash
# Run Slither security analysis
npm run slither

# Generate JSON report
npm run slither:json
```

Slither results are saved to `deployed/SLITHER_<timestamp>.json`

## Usage Examples

### Initialize Contract
```javascript
// For Native Token (ETH/BNB)
await rewards.initialize(
  true,                    // isNativeToken
  ethers.ZeroAddress,      // tokenAddress (not used)
  deadline                 // Unix timestamp
);

// For ERC20 (USDT/USDC)
await rewards.initialize(
  false,                   // isNativeToken
  "0xUSDT_Address",        // tokenAddress
  deadline
);
```

### Deposit Funds
```javascript
// For Native Token
await rewards.depositFunds(
  ethers.parseEther("100"),  // Technical: 100 ETH
  ethers.parseEther("100"),  // Marketing: 100 ETH
  { value: ethers.parseEther("200") }
);

// For ERC20 (approve first)
await usdt.approve(rewardsAddress, parseUnits("200", 6));
await rewards.depositFunds(
  parseUnits("100", 6),  // Technical: 100 USDT
  parseUnits("100", 6)   // Marketing: 100 USDT
);
```

### Set Winners
```javascript
await rewards.setWinner(0, technicalWinnerAddress);  // TECHNICAL = 0
await rewards.setWinner(1, marketingWinnerAddress);  // MARKETING = 1
```

### Winners Claim Rewards
```javascript
// After deadline, before claimDeadline
await rewards.connect(winner).claimBounty(0);  // Technical claims
await rewards.connect(winner).claimBounty(1);  // Marketing claims
```

### Owner Recovers Unclaimed Funds
```javascript
// After claimDeadline (deadline + 30 days)
await rewards.withdrawUnclaimed(0, ownerAddress);  // Technical
await rewards.withdrawUnclaimed(1, ownerAddress);  // Marketing
```

## Contract Information
```javascript
// Get contest configuration
const info = await rewards.getContestInfo();
// Returns: initialized, isNativeToken, tokenAddress, deadline, 
//          claimDeadline, timeUntilDeadline, timeUntilClaimDeadline

// Get bounty details
const bounty = await rewards.getBountyInfo(0);  // 0=TECHNICAL, 1=MARKETING
// Returns: amount, winner, claimed, canClaim, canWithdraw
```

## Events
```solidity
event BountyInitialized(bool isNative, address token, uint256 deadline);
event FundsDeposited(uint256 technicalAmount, uint256 marketingAmount);
event WinnerSet(Category indexed category, address indexed winner);
event BountyClaimed(Category indexed category, address indexed winner, uint256 amount);
event UnclaimedWithdrawn(Category indexed category, uint256 amount);
```

## Project Structure
```
blockchain/
├── contracts/
│   └── BRSCPPRewards.sol       # Main contract
├── scripts/
│   ├── deploy.js               # Deployment script
│   ├── test-rewards.js         # Test suite
│   ├── check-env.js            # Environment checker
│   └── check-accounts.js       # Accounts checker
├── deployed/                   # Deployment & test results
│   ├── BRSCPPRewards_*.json   # Deployment records
│   ├── TEST_*.json            # Test results
│   └── SLITHER_*.json         # Security audit reports
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies
└── .env                       # Environment variables (DO NOT COMMIT)
```

## Deployment Records

All deployments are automatically saved to `deployed/` directory:
```json
{
  "network": "sepolia",
  "contractName": "BRSCPPRewards",
  "contractAddress": "0x...",
  "deployer": "0x...",
  "deploymentTime": "2025-12-13T14:30:00.000Z",
  "blockNumber": 12345678,
  "transactionHash": "0x...",
  "verified": true
}
```

## Security Features

- **No Direct Transfers**: ETH transfers blocked, must use `depositFunds()`
- **Single Initialization**: Cannot reinitialize contract
- **ReentrancyGuard**: All withdrawal functions protected
- **Access Control**: Owner-only functions for admin operations
- **Winner Verification**: Only assigned winners can claim
- **Time Locks**: Enforced deadlines for claims and withdrawals
- **SafeERC20**: Secure token transfer handling

## Verified Contracts

- **Sepolia**: [View on Etherscan](https://sepolia.etherscan.io/address/CONTRACT_ADDRESS)
- **BSC Testnet**: [View on BSCScan](https://testnet.bscscan.com/address/CONTRACT_ADDRESS)
- **Polygon Amoy**: [View on PolygonScan](https://amoy.polygonscan.com/address/CONTRACT_ADDRESS)

## License

MIT License - see LICENSE file

## Author

S.Ivanov

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/brscpp-rewards/issues
- Documentation: See inline code comments

## Changelog

### v1.0.0 (2025-12-13)
- Initial release
- Native and ERC20 token support
- Time-based claim windows
- Security audit complete
- Full test coverage
