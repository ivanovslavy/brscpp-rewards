// scripts/check-accounts.js
require("dotenv").config();

console.log("\n=== Checking .env accounts ===\n");

console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅ Found" : "❌ Missing");
console.log("PRIVATE_KEY_TECHNICAL:", process.env.PRIVATE_KEY_TECHNICAL ? "✅ Found" : "❌ Missing");
console.log("PRIVATE_KEY_MARKETING:", process.env.PRIVATE_KEY_MARKETING ? "✅ Found" : "❌ Missing");
console.log("PRIVATE_KEY_OTHER:", process.env.PRIVATE_KEY_OTHER ? "✅ Found" : "❌ Missing");

if (process.env.PRIVATE_KEY) {
  console.log("\nPRIVATE_KEY length:", process.env.PRIVATE_KEY.length);
}
if (process.env.PRIVATE_KEY_TECHNICAL) {
  console.log("PRIVATE_KEY_TECHNICAL length:", process.env.PRIVATE_KEY_TECHNICAL.length);
}
if (process.env.PRIVATE_KEY_MARKETING) {
  console.log("PRIVATE_KEY_MARKETING length:", process.env.PRIVATE_KEY_MARKETING.length);
}
if (process.env.PRIVATE_KEY_OTHER) {
  console.log("PRIVATE_KEY_OTHER length:", process.env.PRIVATE_KEY_OTHER.length);
}

console.log("\n=== Checking hardhat config ===\n");

const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  console.log(`Total signers loaded: ${signers.length}\n`);
  
  for (let i = 0; i < signers.length; i++) {
    const balance = await hre.ethers.provider.getBalance(signers[i].address);
    console.log(`Signer ${i}: ${signers[i].address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);
  }
}

main();
