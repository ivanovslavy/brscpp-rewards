// scripts/deploy-rewards.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Network configurations
const NETWORKS = {
  localhost: { name: "Localhost", verify: false, wait: 0 },
  sepolia: { name: "Sepolia", verify: true, wait: 30 },
  bscTestnet: { name: "BSC Testnet", verify: true, wait: 30 },
  amoy: { name: "Polygon Amoy", verify: true, wait: 30 },
  mainnet: { name: "Ethereum Mainnet", verify: true, wait: 30 },
  bsc: { name: "BSC Mainnet", verify: true, wait: 30 },
  polygon: { name: "Polygon Mainnet", verify: true, wait: 30 }
};

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

async function saveDeployment(network, deploymentData) {
  const deploymentsDir = path.join(__dirname, "..", "deployed");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const timestamp = getTimestamp();
  const filename = `BRSCPPRewards_${timestamp}_${network}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(
    filepath,
    JSON.stringify(deploymentData, null, 2),
    "utf-8"
  );
  
  log(`Deployment saved: ${filename}`, "green");
}

async function verifyContract(address, constructorArguments, network) {
  log(`Starting verification on ${network}...`, "yellow");
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    log("Contract verified successfully", "green");
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log("Contract already verified", "yellow");
      return true;
    }
    log(`Verification failed: ${error.message}`, "red");
    return false;
  }
}

async function main() {
  const networkName = hre.network.name;
  const networkConfig = NETWORKS[networkName];
  
  if (!networkConfig) {
    log(`Network ${networkName} not configured`, "red");
    process.exit(1);
  }
  
  log(`Deploying BRSCPPRewards to ${networkConfig.name}`, "yellow");
  
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  log(`Deployer: ${deployer.address}`, "green");
  log(`Balance: ${hre.ethers.formatEther(balance)} ETH`, "green");
  
  // Deploy contract
  log("Deploying contract...", "yellow");
  const BRSCPPRewards = await hre.ethers.getContractFactory("BRSCPPRewards");
  const contract = await BRSCPPRewards.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  log(`Contract deployed to: ${contractAddress}`, "green");
  
  // Prepare deployment data
  const deploymentData = {
    network: networkConfig.name,
    contractName: "BRSCPPRewards",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: contract.deploymentTransaction().blockNumber,
    transactionHash: contract.deploymentTransaction().hash,
    constructorArguments: [],
    compiler: {
      version: "0.8.27",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  };
  
  // Save deployment
  await saveDeployment(networkName, deploymentData);
  
  // Verify contract if not localhost
  if (networkConfig.verify) {
    log(`Waiting ${networkConfig.wait} seconds before verification...`, "yellow");
    await new Promise(resolve => setTimeout(resolve, networkConfig.wait * 1000));
    
    const verified = await verifyContract(
      contractAddress,
      [],
      networkConfig.name
    );
    
    deploymentData.verified = verified;
    deploymentData.verificationTime = new Date().toISOString();
    
    // Update deployment file with verification status
    await saveDeployment(networkName, deploymentData);
  }
  
  log("Deployment completed successfully", "green");
  log(`Contract address: ${contractAddress}`, "green");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Deployment failed: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });
