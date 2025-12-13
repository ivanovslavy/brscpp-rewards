// scripts/test-rewards.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Colors
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function increaseTime(seconds) {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
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
  return deploymentData.contractAddress;
}

async function saveTestResults(network, testData) {
  const deploymentsDir = path.join(__dirname, "..", "deployed");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const timestamp = getTimestamp();
  const filename = `TEST_${timestamp}_${network}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(
    filepath,
    JSON.stringify(testData, null, 2),
    "utf-8"
  );
  
  log(`Test results saved: ${filename}`, "green");
}

async function main() {
  const networkName = hre.network.name;
  const isLocalhost = networkName === "localhost" || networkName === "hardhat";
  
  const testResults = {
    network: networkName,
    testName: "BRSCPPRewards Full Test Suite",
    startTime: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  log("\n=== BRSCPP Rewards Test Script ===\n", "yellow");
  log(`Network: ${networkName}\n`, "blue");
  
  const [owner, technical, marketing, other] = await hre.ethers.getSigners();
  
  log("Accounts:", "blue");
  log(`Owner: ${owner.address}`);
  log(`Technical: ${technical.address}`);
  log(`Marketing: ${marketing.address}`);
  log(`Other: ${other.address}\n`);
  
  testResults.accounts = {
    owner: owner.address,
    technical: technical.address,
    marketing: marketing.address,
    other: other.address
  };
  
  // Deploy fresh contract
  log("Deploying fresh BRSCPPRewards contract...", "yellow");
  const BRSCPPRewards = await hre.ethers.getContractFactory("BRSCPPRewards");
  const rewards = await BRSCPPRewards.deploy();
  await rewards.waitForDeployment();
  const contractAddress = await rewards.getAddress();
  log(`Contract deployed: ${contractAddress}\n`, "green");
  
  // Save deployment
  const deploymentData = {
    network: networkName,
    contractName: "BRSCPPRewards",
    contractAddress: contractAddress,
    deployer: owner.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: rewards.deploymentTransaction().blockNumber,
    transactionHash: rewards.deploymentTransaction().hash,
    constructorArguments: [],
    purpose: "Test deployment"
  };
  await saveDeployment(networkName, deploymentData);
  
  testResults.contractAddress = contractAddress;
  testResults.deploymentTx = rewards.deploymentTransaction().hash;
  
  // Initialize
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  const currentTime = (await hre.ethers.provider.getBlock(currentBlock)).timestamp;
  const waitTime = isLocalhost ? 30 : 60;
  const deadline = currentTime + waitTime;
  
  log("\nInitializing contract...", "yellow");
  log(`Current time: ${currentTime}`);
  log(`Deadline: ${deadline} (current + ${waitTime}s)`);
  log(`Claim deadline: ${deadline + 30 * 24 * 60 * 60} (deadline + 30 days)\n`);
  
  const tx1 = await rewards.initialize(true, hre.ethers.ZeroAddress, deadline);
  await tx1.wait();
  log("Initialized successfully\n", "green");
  
  testResults.configuration = {
    isNativeToken: true,
    tokenAddress: hre.ethers.ZeroAddress,
    deadline: deadline,
    claimDeadline: deadline + 30 * 24 * 60 * 60,
    waitTime: waitTime
  };
  
  // Deposit funds
  const techAmount = hre.ethers.parseEther("0.1");
  const marketAmount = hre.ethers.parseEther("0.1");
  const totalAmount = hre.ethers.parseEther("0.2");
  
  log("Depositing funds...", "yellow");
  log(`Technical: ${hre.ethers.formatEther(techAmount)} ETH`);
  log(`Marketing: ${hre.ethers.formatEther(marketAmount)} ETH`);
  log(`Total: ${hre.ethers.formatEther(totalAmount)} ETH\n`);
  
  const tx2 = await rewards.depositFunds(techAmount, marketAmount, { value: totalAmount });
  await tx2.wait();
  log("Funds deposited successfully\n", "green");
  
  testResults.funding = {
    technicalAmount: hre.ethers.formatEther(techAmount) + " ETH",
    marketingAmount: hre.ethers.formatEther(marketAmount) + " ETH",
    totalAmount: hre.ethers.formatEther(totalAmount) + " ETH"
  };
  
  // Set winners
  log("Setting winners...", "yellow");
  const tx3 = await rewards.setWinner(0, technical.address);
  await tx3.wait();
  const tx4 = await rewards.setWinner(1, marketing.address);
  await tx4.wait();
  log(`Technical winner: ${technical.address}`, "green");
  log(`Marketing winner: ${marketing.address}\n`, "green");
  
  testResults.winners = {
    technical: technical.address,
    marketing: marketing.address
  };
  
  // TEST 1: Try to claim BEFORE deadline (should fail)
  log("TEST 1: Trying to claim BEFORE deadline...", "yellow");
  testResults.summary.total++;
  try {
    await rewards.connect(technical).claimBounty(0);
    log("ERROR: Should have failed!\n", "red");
    testResults.tests.push({
      name: "Claim before deadline should fail",
      status: "FAILED",
      expected: "Revert with 'Contest active'",
      actual: "Transaction succeeded"
    });
    testResults.summary.failed++;
  } catch (error) {
    const errorMsg = error.message.split('(')[0].trim();
    log(`Claim rejected: ${errorMsg}`, "green");
    log("Expected behavior: Contest still active\n", "green");
    testResults.tests.push({
      name: "Claim before deadline should fail",
      status: "PASSED",
      expected: "Revert with 'Contest active'",
      actual: errorMsg
    });
    testResults.summary.passed++;
  }
  
  // TEST 2: Try owner withdrawal BEFORE claim deadline (should fail)
  log("TEST 2: Owner trying to withdraw BEFORE claim deadline...", "yellow");
  testResults.summary.total++;
  try {
    await rewards.withdrawUnclaimed(0, owner.address);
    log("ERROR: Should have failed!\n", "red");
    testResults.tests.push({
      name: "Owner withdrawal before claim deadline should fail",
      status: "FAILED",
      expected: "Revert with 'Claim period active'",
      actual: "Transaction succeeded"
    });
    testResults.summary.failed++;
  } catch (error) {
    const errorMsg = error.message.split('(')[0].trim();
    log(`Withdrawal rejected: ${errorMsg}`, "green");
    log("Expected behavior: Claim period still active\n", "green");
    testResults.tests.push({
      name: "Owner withdrawal before claim deadline should fail",
      status: "PASSED",
      expected: "Revert with 'Claim period active'",
      actual: errorMsg
    });
    testResults.summary.passed++;
  }
  
  // Wait for deadline to pass
  log(`Waiting for deadline to pass...`, "yellow");
  
  if (isLocalhost) {
    log(`Increasing time by ${waitTime + 5} seconds on localhost...`);
    await increaseTime(waitTime + 5);
    const newBlock = await hre.ethers.provider.getBlockNumber();
    const newTime = (await hre.ethers.provider.getBlock(newBlock)).timestamp;
    log(`Time increased, current time: ${newTime}\n`);
  } else {
    log(`Waiting ${waitTime + 10} seconds on ${networkName}...`);
    await sleep(waitTime + 10);
    log("Wait complete\n");
  }
  
  const checkBlock = await hre.ethers.provider.getBlockNumber();
  const checkTime = (await hre.ethers.provider.getBlock(checkBlock)).timestamp;
  log(`Current time: ${checkTime}`);
  log(`Deadline: ${deadline}`);
  log(`Time passed: ${checkTime > deadline ? 'YES' : 'NO'}\n`, checkTime > deadline ? "green" : "red");
  
  // TEST 3: Winners claiming AFTER deadline
  log("TEST 3: Winners claiming AFTER deadline...", "yellow");
  testResults.summary.total++;
  
  const techBalanceBefore = await hre.ethers.provider.getBalance(technical.address);
  const marketBalanceBefore = await hre.ethers.provider.getBalance(marketing.address);
  
  try {
    log("Technical claiming...");
    const tx5 = await rewards.connect(technical).claimBounty(0);
    const receipt5 = await tx5.wait();
    const gasCost1 = receipt5.gasUsed * receipt5.gasPrice;
    
    log("Marketing claiming...");
    const tx6 = await rewards.connect(marketing).claimBounty(1);
    const receipt6 = await tx6.wait();
    const gasCost2 = receipt6.gasUsed * receipt6.gasPrice;
    
    const techBalanceAfter = await hre.ethers.provider.getBalance(technical.address);
    const marketBalanceAfter = await hre.ethers.provider.getBalance(marketing.address);
    
    const techReceived = techBalanceAfter - techBalanceBefore + gasCost1;
    const marketReceived = marketBalanceAfter - marketBalanceBefore + gasCost2;
    
    log(`\nTechnical received: ${hre.ethers.formatEther(techReceived)} ETH`, "green");
    log(`Marketing received: ${hre.ethers.formatEther(marketReceived)} ETH\n`, "green");
    
    testResults.tests.push({
      name: "Winners claim after deadline",
      status: "PASSED",
      expected: "Both winners receive funds",
      actual: `Technical: ${hre.ethers.formatEther(techReceived)} ETH, Marketing: ${hre.ethers.formatEther(marketReceived)} ETH`
    });
    testResults.summary.passed++;
  } catch (error) {
    log(`ERROR: Claim failed: ${error.message}\n`, "red");
    testResults.tests.push({
      name: "Winners claim after deadline",
      status: "FAILED",
      expected: "Both winners receive funds",
      actual: error.message
    });
    testResults.summary.failed++;
  }
  
  // TEST 4: Try double claim
  log("TEST 4: Trying to claim twice (should fail)...", "yellow");
  testResults.summary.total++;
  try {
    await rewards.connect(technical).claimBounty(0);
    log("ERROR: Should have failed!\n", "red");
    testResults.tests.push({
      name: "Double claim should fail",
      status: "FAILED",
      expected: "Revert with 'Already claimed'",
      actual: "Transaction succeeded"
    });
    testResults.summary.failed++;
  } catch (error) {
    const errorMsg = error.message.split('(')[0].trim();
    log(`Double claim rejected: ${errorMsg}`, "green");
    log("Expected behavior: Already claimed\n", "green");
    testResults.tests.push({
      name: "Double claim should fail",
      status: "PASSED",
      expected: "Revert with 'Already claimed'",
      actual: errorMsg
    });
    testResults.summary.passed++;
  }
  
  // TEST 5: Try non-winner claim
  log("TEST 5: Non-winner trying to claim (should fail)...", "yellow");
  testResults.summary.total++;
  try {
    await rewards.connect(other).claimBounty(0);
    log("ERROR: Should have failed!\n", "red");
    testResults.tests.push({
      name: "Non-winner claim should fail",
      status: "FAILED",
      expected: "Revert with 'Not winner'",
      actual: "Transaction succeeded"
    });
    testResults.summary.failed++;
  } catch (error) {
    const errorMsg = error.message.split('(')[0].trim();
    log(`Unauthorized claim rejected: ${errorMsg}`, "green");
    log("Expected behavior: Not winner\n", "green");
    testResults.tests.push({
      name: "Non-winner claim should fail",
      status: "PASSED",
      expected: "Revert with 'Not winner'",
      actual: errorMsg
    });
    testResults.summary.passed++;
  }
  
  // Owner withdrawal timeline explanation
  log("\n=== OWNER WITHDRAWAL TIMELINE ===\n", "blue");
  const info = await rewards.getContestInfo();
  log("Contest deadline: " + deadline);
  log("Claim deadline: " + info._claimDeadline.toString());
  log("Claim window: 30 days after contest deadline\n");
  
  log("Owner can withdraw unclaimed funds ONLY after claim deadline", "yellow");
  log("Timeline:");
  log("  1. Contest ends (deadline)");
  log("  2. Winners have 30 days to claim");
  log("  3. After 30 days, owner can call withdrawUnclaimed(category, recipient)\n");
  
  log("Example:");
  log("  Contest deadline: Jan 1, 2025");
  log("  Claim deadline: Jan 31, 2025");
  log("  Owner can withdraw: Feb 1, 2025 onwards\n");
  
  testResults.endTime = new Date().toISOString();
  testResults.timeline = {
    contestDeadline: deadline,
    claimDeadline: info._claimDeadline.toString(),
    claimWindowDays: 30
  };
  
  // Save test results
  await saveTestResults(networkName, testResults);
  
  log("=== Test Summary ===\n", "blue");
  log(`Total tests: ${testResults.summary.total}`, "yellow");
  log(`Passed: ${testResults.summary.passed}`, "green");
  log(`Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? "red" : "green");
  
  log("\n=== All Tests Completed ===\n", "green");
  log(`Contract: ${contractAddress}`, "green");
  log(`Network: ${networkName}\n`, "green");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`\nTest failed: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });
