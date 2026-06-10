// Local test (npx hardhat run scripts/test-faucet-local.js) — tokens + faucet flows.
const { ethers } = require("hardhat");

function assert(cond, msg) { if (!cond) { throw new Error("FAIL: " + msg); } console.log("  ✓ " + msg); }

async function main() {
  const [owner, user] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestStableToken");
  const usdt = await Token.deploy("Test USD Tether", "tUSDT", 6, owner.address); await usdt.waitForDeployment();
  const usdc = await Token.deploy("Test USD Coin", "tUSDC", 6, owner.address); await usdc.waitForDeployment();
  const eurc = await Token.deploy("Test Euro Coin", "tEURC", 6, owner.address); await eurc.waitForDeployment();
  console.log("tokens deployed");

  const Faucet = await ethers.getContractFactory("GembaFaucet");
  const faucet = await Faucet.deploy(owner.address, ethers.parseEther("0.1"), ethers.parseEther("50")); await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();

  const drip = 10000n * 10n ** 6n; // 10,000 with 6 decimals
  for (const t of [usdt, usdc, eurc]) {
    await (await t.setMinter(faucetAddr, true)).wait();
    await (await faucet.configureToken(await t.getAddress(), true, drip)).wait();
  }
  await (await owner.sendTransaction({ to: faucetAddr, value: ethers.parseEther("10") })).wait();
  console.log("faucet configured + funded");

  // GMB claim
  const before = await ethers.provider.getBalance(user.address);
  await (await faucet.connect(user).claimGMB()).wait();
  const after = await ethers.provider.getBalance(user.address);
  assert(after > before, "user received GMB drip");

  // token claim
  await (await faucet.connect(user).claimToken(await usdt.getAddress())).wait();
  assert((await usdt.balanceOf(user.address)) === drip, "user received 10,000 tUSDT");

  // cooldown blocks immediate re-claim
  let reverted = false;
  try { await faucet.connect(user).claimGMB(); } catch { reverted = true; }
  assert(reverted, "second GMB claim blocked by cooldown");

  // unsupported token reverts
  reverted = false;
  try { await faucet.connect(user).claimToken(owner.address); } catch { reverted = true; }
  assert(reverted, "unsupported token reverts");

  // after 24h, claim works again
  await ethers.provider.send("evm_increaseTime", [24 * 3600 + 1]);
  await ethers.provider.send("evm_mine", []);
  await (await faucet.connect(user).claimToken(await usdt.getAddress())).wait();
  assert((await usdt.balanceOf(user.address)) === drip * 2n, "claim again after 24h cooldown");

  // pause blocks claims
  await (await faucet.pause()).wait();
  reverted = false;
  try { await faucet.connect(user).claimToken(await usdc.getAddress()); } catch { reverted = true; }
  assert(reverted, "paused faucet blocks claims");

  // global daily cap protects the reserve from a sybil swarm
  const [, , u2, u3] = await ethers.getSigners();
  const capFaucet = await Faucet.deploy(owner.address, ethers.parseEther("0.1"), ethers.parseEther("0.15"));
  await capFaucet.waitForDeployment();
  await (await owner.sendTransaction({ to: await capFaucet.getAddress(), value: ethers.parseEther("5") })).wait();
  await (await capFaucet.connect(u2).claimGMB()).wait(); // 0.1 ok
  reverted = false;
  try { await capFaucet.connect(u3).claimGMB(); } catch { reverted = true; } // 0.2 > 0.15 cap
  assert(reverted, "global daily cap blocks drain beyond cap (different wallets)");

  console.log("\nALL FAUCET TESTS PASSED");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
