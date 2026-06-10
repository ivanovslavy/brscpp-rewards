// Redeploy GembaWinFactory (with the supported-token gate) pointing at the existing,
// already-verified GembaWin template, then whitelist USDT/USDC/EURC.
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const TEMPLATE = "0x1c99D2912D6b8F31b7F9c697C242f8882474524D"; // unchanged GembaWin template
const TOKENS = {
  USDT: "0x0821EAAE0328b02d6f85C36925acb92E90ef680C",
  USDC: "0x131f3087ecabA6f7ae91439DDaF70f4269D4b9Ef",
  EURC: "0x05003C73FfEC1c2f56021549501Dd7AD850e39C3",
};

async function main() {
  const [d] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("GembaWinFactory");
  const factory = await Factory.deploy(d.address, TEMPLATE, 0);
  await factory.waitForDeployment();
  const addr = await factory.getAddress();
  for (const t of Object.values(TOKENS)) await (await factory.setSupportedToken(t, true)).wait();
  console.log("supported tokens whitelisted");

  const out = { network: "GembaBlockchain Testnet", chainId: 821207, factory: addr, template: TEMPLATE, tokens: TOKENS, owner: d.address, deployedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(__dirname, "..", "deployed", "gembawin-factory-v2-gemba.json"), JSON.stringify(out, null, 2));
  console.log("FACTORY=" + addr);
  console.log("TEMPLATE=" + TEMPLATE);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
