// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Prepare accounts array from .env
const accounts = [];
if (process.env.PRIVATE_KEY) accounts.push(process.env.PRIVATE_KEY);
if (process.env.PRIVATE_KEY_TECHNICAL) accounts.push(process.env.PRIVATE_KEY_TECHNICAL);
if (process.env.PRIVATE_KEY_MARKETING) accounts.push(process.env.PRIVATE_KEY_MARKETING);
if (process.env.PRIVATE_KEY_OTHER) accounts.push(process.env.PRIVATE_KEY_OTHER);

module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: accounts.length > 0 ? accounts : undefined
    },
    
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: accounts,
      chainId: 11155111
    },
    
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: accounts,
      chainId: 97
    },
    
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: accounts,
      chainId: 80002
    },
    
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: accounts,
      chainId: 1
    },
    
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
      accounts: accounts,
      chainId: 56
    },
    
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: accounts,
      chainId: 137
    }
  },
  
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  
  sourcify: {
    enabled: false
  }
};
