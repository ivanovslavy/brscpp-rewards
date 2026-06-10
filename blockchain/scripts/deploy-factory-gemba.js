// Deploy the GembaWin template + GembaWinFactory onto GembaBlockchain testnet.
// Factory admin = deployer (founder). Deploy fee = 0 (configurable via setDeployFee).
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address, "| balance:", ethers.formatEther(bal), "GMB");

  console.log("Deploying GembaWin template...");
  const Template = await ethers.getContractFactory("GembaWin");
  const template = await Template.deploy();
  await template.waitForDeployment();
  const templateAddress = await template.getAddress();
  console.log("GembaWin template:", templateAddress);

  console.log("Deploying GembaWinFactory(owner, template, fee=0)...");
  const Factory = await ethers.getContractFactory("GembaWinFactory");
  const factory = await Factory.deploy(deployer.address, templateAddress, ethers.parseEther("0"));
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("GembaWinFactory:", factoryAddress);

  const out = {
    network: "GembaBlockchain Testnet",
    chainId: 821207,
    factory: factoryAddress,
    template: templateAddress,
    owner: deployer.address,
    deployFee: "0",
    deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "deployed");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "gembawin-factory-gemba.json"), JSON.stringify(out, null, 2));
  console.log("Saved deployed/gembawin-factory-gemba.json");
  console.log("FACTORY=" + factoryAddress);
  console.log("TEMPLATE=" + templateAddress);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
