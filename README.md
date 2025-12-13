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
git clone https://github.com/ivanovslavy/brscpp-rewards.git
cd brscpp-rewards/blockchain

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Configuration

### Create Environment File
```bash
cp .env.example .env
nano .env
```

### Configure .env
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

### Get Required Keys

**Private Key** (from MetaMask):
- Settings → Security & Privacy → Show Private Key
- Copy WITHOUT `0x` prefix
- Use TEST wallet only!

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

## Quick Start

### Deploy Contract
```bash
# Deploy to Sepolia with automatic verification
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to other networks
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deploy.js --network bscTestnet
npx hardhat run scripts/deploy.js --network amoy
```

Deployment automatically:
- Deploys contract
- Waits 30 seconds (60s on testnets/mainnets)
- Verifies contract on block explorer
- Saves deployment record to `deployed/BRSCPPRewards_<timestamp>_<network>.json`

### Run Full Test Suite
```bash
# Test on Sepolia (waits 60s for real deadline)
npx hardhat run scripts/test-rewards.js --network sepolia

# Test on localhost (instant time manipulation)
npx hardhat run scripts/test-rewards.js --network localhost
```

Test suite automatically:
1. Deploys fresh contract
2. Initializes with deadline
3. Deposits funds (0.1 ETH per category)
4. Sets winner addresses
5. Tests claim rejection before deadline 
6. Tests owner withdrawal rejection 
7. Waits for deadline to pass
8. Tests successful claims 
9. Tests double claim rejection 
10. Tests unauthorized claim rejection 
11. Saves test results to `deployed/TEST_<timestamp>_<network>.json`

## Wallet Management (Test Helpers)

### Create Temporary Test Wallets
```bash
# Generate 5 new EVM wallets with private keys
npx hardhat run scripts/create-5-wallets.js
```

Output:
- 5 wallet addresses with private keys and mnemonics
- Saved to `wallets/evm-wallets-<timestamp>.json`
- NEVER commit wallets/ directory!

### Drain Test Wallets
```bash
# Drain all wallets on specific network
npx hardhat run scripts/drain-wallets.js --network sepolia

# Drain on other networks
npx hardhat run scripts/drain-wallets.js --network bscTestnet
npx hardhat run scripts/drain-wallets.js --network amoy
```

Process:
1. Loads latest wallet file from `wallets/`
2. Prompts for recipient address
3. Confirms drainage
4. Drains all non-zero balances
5. Saves report to `wallets/drain-report-<network>-<timestamp>.json`

## NPM Scripts

### Deployment
```bash
npm run deploy:localhost      # Deploy to local Hardhat node
npm run deploy:sepolia        # Deploy to Sepolia testnet
npm run deploy:bsc-testnet    # Deploy to BSC testnet
npm run deploy:amoy           # Deploy to Polygon Amoy testnet
npm run deploy:mainnet        # Deploy to Ethereum mainnet
npm run deploy:bsc            # Deploy to BSC mainnet
npm run deploy:polygon        # Deploy to Polygon mainnet
```

### Testing
```bash
npm run test:localhost        # Test on local node
npm run test:sepolia          # Test on Sepolia
npm run test:bsc-testnet      # Test on BSC testnet
npm run test:amoy             # Test on Polygon Amoy
```

### Wallet Management
```bash
npm run wallets:create              # Create 5 test wallets
npm run wallets:drain:sepolia       # Drain wallets on Sepolia
npm run wallets:drain:bsc-testnet   # Drain wallets on BSC testnet
npm run wallets:drain:amoy          # Drain wallets on Amoy
npm run wallets:drain:mainnet       # Drain wallets on Ethereum
npm run wallets:drain:bsc           # Drain wallets on BSC
npm run wallets:drain:polygon       # Drain wallets on Polygon
```

### Security & Utilities
```bash
npm run compile               # Compile contracts
npm run clean                 # Clean build artifacts
npm run node                  # Start local Hardhat node
npm run slither               # Run Slither security analysis
npm run slither:json          # Generate JSON security report
```

## Contract Usage

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

## Project Structure
```
blockchain/
├── contracts/
│   └── BRSCPPRewards.sol          # Main contract
├── scripts/
│   ├── deploy.js                  # Deployment with auto-verify
│   ├── test-rewards.js            # Full test suite
│   ├── create-5-wallets.js        # Generate test wallets
│   ├── drain-wallets.js           # Drain wallet balances
│   └── run-slither.sh             # Slither JSON export
├── deployed/                      # Deployment & test results
│   ├── BRSCPPRewards_*.json      # Deployment records
│   ├── TEST_*.json               # Test results
│   └── SLITHER_*.json            # Security audit reports
├── wallets/                       # Test wallets (NOT in git)
│   ├── evm-wallets-*.json        # Generated wallets
│   └── drain-report-*.json       # Drainage reports
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies & scripts
├── .env                          # Environment variables
├── .env.example                  # Example environment file
└── README.md                     # This file
```

## Security Features

- **No Direct Transfers**: ETH transfers blocked, must use `depositFunds()`
- **Single Initialization**: Cannot reinitialize contract
- **ReentrancyGuard**: All withdrawal functions protected
- **Access Control**: Owner-only functions for admin operations
- **Winner Verification**: Only assigned winners can claim
- **Time Locks**: Enforced deadlines for claims and withdrawals
- **SafeERC20**: Secure token transfer handling

## Events
```solidity
event BountyInitialized(bool isNative, address token, uint256 deadline);
event FundsDeposited(uint256 technicalAmount, uint256 marketingAmount);
event WinnerSet(Category indexed category, address indexed winner);
event BountyClaimed(Category indexed category, address indexed winner, uint256 amount);
event UnclaimedWithdrawn(Category indexed category, uint256 amount);
```

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
- GitHub Issues: https://github.com/ivanovslavy/brscpp-rewards/issues

## Changelog

### v1.0.0 (2025-12-13)
- Initial release
- Native and ERC20 token support
- Time-based claim windows
- Test wallet management tools
- Security audit complete
- Full test coverage
- Automated deployment with verification
