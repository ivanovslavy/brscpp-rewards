// scripts/check-env.js
const hre = require("hardhat");

async function main() {
  console.log("\n=== Checking Environment ===\n");
  
  // Check private key
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Check network
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Check if enough balance for test
  const requiredBalance = hre.ethers.parseEther("0.3");
  if (balance < requiredBalance) {
    console.log("\n⚠️  WARNING: Low balance!");
    console.log("Required:", hre.ethers.formatEther(requiredBalance), "ETH");
    console.log("Get testnet ETH from faucets");
  } else {
    console.log("\n✅ Balance OK for testing");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
