// Deploy the test stablecoins (USDT/USDC/EURC) + GembaFaucet on GembaBlockchain testnet,
// wire the faucet as a minter, configure drips, and fund the faucet with GMB.
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const STABLES = [
  { name: "Tether USD (Test)", symbol: "USDT", decimals: 6 },
  { name: "USD Coin (Test)", symbol: "USDC", decimals: 6 },
  { name: "Euro Coin (Test)", symbol: "EURC", decimals: 6 },
];
const STABLE_DRIP = 10000n * 10n ** 6n; // 10,000 (6 decimals)
const GMB_DRIP = ethers.parseEther("0.1"); // 0.1 GMB per claim
const GMB_DAILY_CAP = ethers.parseEther("50"); // max 50 GMB/24h globally (reserve protection)
const GMB_FUND = ethers.parseEther("1000"); // seed the faucet

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("TestStableToken");
  const tokens = {};
  for (const s of STABLES) {
    const t = await Token.deploy(s.name, s.symbol, s.decimals, deployer.address);
    await t.waitForDeployment();
    tokens[s.symbol] = await t.getAddress();
    console.log(`${s.symbol}: ${tokens[s.symbol]}`);
  }

  const Faucet = await ethers.getContractFactory("GembaFaucet");
  const faucet = await Faucet.deploy(deployer.address, GMB_DRIP, GMB_DAILY_CAP);
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();
  console.log("Faucet:", faucetAddr);

  for (const s of STABLES) {
    const t = await ethers.getContractAt("TestStableToken", tokens[s.symbol]);
    await (await t.setMinter(faucetAddr, true)).wait();
    await (await faucet.configureToken(tokens[s.symbol], true, STABLE_DRIP)).wait();
  }
  await (await deployer.sendTransaction({ to: faucetAddr, value: GMB_FUND })).wait();
  console.log("minters set, tokens configured, faucet funded with", ethers.formatEther(GMB_FUND), "GMB");

  const out = {
    network: "GembaBlockchain Testnet", chainId: 821207,
    faucet: faucetAddr, gmbDrip: "0.1", stableDrip: "10000",
    tokens, owner: deployer.address, deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "deployed");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "faucet-gemba.json"), JSON.stringify(out, null, 2));
  console.log("USDT=" + tokens.USDT);
  console.log("USDC=" + tokens.USDC);
  console.log("EURC=" + tokens.EURC);
  console.log("FAUCET=" + faucetAddr);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
