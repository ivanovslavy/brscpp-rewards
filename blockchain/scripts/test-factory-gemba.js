// Smoke test: create a bounty via the factory and read its config back from the clone.
const { ethers } = require("hardhat");

const FACTORY = "0xf2dc67274CCd82bcFa3e446BcD55fB1889866e26";

async function main() {
  const [signer] = await ethers.getSigners();
  const factory = await ethers.getContractAt("GembaWinFactory", FACTORY);

  const params = {
    name: "Hackathon Prizes Q3",
    isNativeToken: true,
    tokenAddress: ethers.ZeroAddress,
    deadlineDays: 7,
    positionCount: 3,
  };

  console.log("createBounty...");
  const tx = await factory.createBounty(params, { value: 0 });
  const rc = await tx.wait();

  const ev = rc.logs
    .map((l) => { try { return factory.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "BountyCreated");
  const cloneAddr = ev.args.contractAddress;
  console.log("  clone:", cloneAddr, "| id:", ev.args.contractId.toString());

  const clone = await ethers.getContractAt("GembaWin", cloneAddr);
  const info = await clone.getContestInfo();
  console.log("  owner:", info[0]);
  console.log("  name:", info[1]);
  console.log("  initialized:", info[2], "| positionCount:", info[8].toString());
  console.log("  OWNER_OK:", info[0].toLowerCase() === signer.address.toLowerCase());
  console.log("  NAME_OK:", info[1] === params.name);
  console.log("  POSITIONS_OK:", info[8].toString() === String(params.positionCount));
  console.log("  factory totalContracts:", (await factory.totalContracts()).toString());

  // fund it (1 + 2 + 3 GMB) to confirm deposit works
  console.log("depositFunds [1,2,3] GMB...");
  const amts = [ethers.parseEther("1"), ethers.parseEther("2"), ethers.parseEther("3")];
  const total = ethers.parseEther("6");
  await (await clone.depositFunds(amts, { value: total })).wait();
  const b0 = await clone.getBountyInfo(0);
  console.log("  position0 amount:", ethers.formatEther(b0[0]), "GMB | funded OK:", b0[0] === amts[0]);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
