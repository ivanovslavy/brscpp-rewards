// Local test: GembaWin factory supported-token gate.
const { ethers } = require("hardhat");
function assert(c, m) { if (!c) throw new Error("FAIL: " + m); console.log("  ✓ " + m); }
const ZERO = ethers.ZeroAddress;

async function main() {
  const [owner, creator] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestStableToken");
  const usdc = await Token.deploy("USD Coin", "USDC", 6, owner.address); await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();

  const Tpl = await ethers.getContractFactory("GembaWin");
  const tpl = await Tpl.deploy(); await tpl.waitForDeployment();
  const Factory = await ethers.getContractFactory("GembaWinFactory");
  const factory = await Factory.deploy(owner.address, await tpl.getAddress(), 0); await factory.waitForDeployment();

  const base = { name: "Contest", isNativeToken: false, tokenAddress: usdcAddr, deadlineDays: 7, positionCount: 2 };

  // unsupported until configured
  let reverted = false;
  try { await factory.connect(creator).createBounty(base, { value: 0 }); } catch { reverted = true; }
  assert(reverted, "ERC-20 contest reverts before token is supported");

  await (await factory.setSupportedToken(usdcAddr, true)).wait();
  await (await factory.connect(creator).createBounty(base, { value: 0 })).wait();
  assert(Number(await factory.totalContracts()) === 1, "ERC-20 contest works once token is supported");

  // native always allowed
  await (await factory.connect(creator).createBounty({ ...base, isNativeToken: true, tokenAddress: ZERO }, { value: 0 })).wait();
  assert(Number(await factory.totalContracts()) === 2, "native GMB contest always allowed");

  console.log("\nALL GEMBAWIN TOKEN-GATE TESTS PASSED");
}
main().then(() => process.exit(0)).catch(e => { console.error(e.message || e); process.exit(1); });
