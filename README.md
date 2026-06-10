# GembaWin

**On-chain bounty & reward contests — permissionless, factory-deployed, trustless payout.**
Built on **GembaBlockchain Testnet** by [GEMBA IT](https://gembait.com).

Live dApp: **https://win.gembait.com**

---

## What it is

GembaWin lets **anyone** launch a prize contest on-chain. A creator deploys a contest
through the **factory** (paying a small fee), defines **any number of prize positions**
(1–50), funds them in **native GMB or any ERC-20**, and names a winner per position.
Winners **claim their prize directly** from the contest contract after the deadline;
anything left unclaimed returns to the creator after a 30-day window. No escrow operator,
no custody, no platform cut on the prizes.

Unlike the original single-purpose reward contract, GembaWin uses the proven
**factory + minimal-proxy** pattern: one audited template, cheaply cloned per contest.

## How it works

```
GembaWinFactory ──createBounty(name, asset, positions, deadline)──►  GembaWin clone (EIP-1167)
   (permissionless,                                                    owner = creator
    small fee)                                                         ├─ depositFunds([...])   (owner funds every position)
                                                                       ├─ setWinner(i, addr)    (owner, before deadline)
                                                                       ├─ claimBounty(i)        (winner, after deadline)
                                                                       └─ withdrawUnclaimed(i)  (owner, after claim window)
```

- **Permissionless creation** — anyone can create a contest and becomes its sole owner.
- **Any number of prizes** — positions are plain indices `0..N-1`, each with its own
  amount and winner. No fixed categories.
- **Native or ERC-20** — prizes in GMB or any token.
- **Trustless payout** — funds live in the contest contract; winners claim directly.
- **Factory admin** (the deployer) only manages the create fee, pause and fee withdrawal —
  it has **no control** over any contest's funds.

## Live on GembaBlockchain Testnet (chainId 821207) — all verified on GembaScan

| Contract | Address |
|---|---|
| **GembaWinFactory** | [`0xf2dc67274CCd82bcFa3e446BcD55fB1889866e26`](https://testnet.gembascan.io/address/0xf2dc67274CCd82bcFa3e446BcD55fB1889866e26) |
| **GembaWin** (template) | [`0x1c99D2912D6b8F31b7F9c697C242f8882474524D`](https://testnet.gembascan.io/address/0x1c99D2912D6b8F31b7F9c697C242f8882474524D) |

## Project layout

```
gembawin/
├── src/                 # React 19 + Vite dApp (Home, Create, Contests, Settings, Contact)
│   ├── pages/           # Create (launch a contest) · Contests (fund/set winner/claim) · Settings (factory owner)
│   ├── lib/             # useFactory hook (ethers via wagmi), ethers adapter
│   ├── contracts/       # ABIs + deployed addresses (hardhat-config.js)
│   ├── config/          # wagmi / chain config (GembaBlockchain testnet)
│   └── i18n/            # English / Български / Español
├── server.cjs           # serves the build + /api/contact (Turnstile → contacts@gembait.com)
├── blockchain/
│   ├── contracts/       # GembaWin.sol, GembaWinFactory.sol (Solidity 0.8.27, OZ v5)
│   ├── scripts/         # deploy-factory-gemba.js, test-factory-gemba.js, run-slither.sh
│   ├── deployed/        # deployment records (addresses)
│   └── hardhat.config.js
└── deploy/              # deploy-win.sh (systemd + apache, run with sudo)
```

## Run it

### Frontend
```bash
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
node server.cjs    # serve dist/ + contact API  (PORT, SMTP_*, TURNSTILE_SECRET_KEY via env)
```

### Contracts (Hardhat)
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy-factory-gemba.js --network gemba   # deploy template + factory
npx hardhat verify --network gemba <address> [args...]            # verify on GembaScan
node ../  # (the factory deploys each contest as an EIP-1167 clone — see test-factory-gemba.js)
```

The `gemba` network (GembaBlockchain testnet, RPC `https://testnet.gembascan.io/rpc`)
and the GembaScan verification endpoint are configured in `blockchain/hardhat.config.js`.

## Tech stack

- **Contracts:** Solidity 0.8.27, OpenZeppelin v5 (`ReentrancyGuard`, `AccessControlEnumerable`,
  `SafeERC20`, `Address`), EIP-1167 minimal proxies, Hardhat.
- **Frontend:** React 19, Vite, wagmi + ethers v6, react-i18next, react-hot-toast.
- **Network:** GembaBlockchain Testnet (Cosmos EVM, chainId 821207, native GMB).

## Security notes

- Contest contracts use **CEI + `nonReentrant`** on every value path; native transfers use
  OpenZeppelin `Address.sendValue`; ERC-20 uses `SafeERC20`.
- `initialize` is one-shot and called by the factory in the **same transaction** as the
  clone is created — no front-running window.
- The factory validates the template is a contract; fee accounting tracks only the collected
  create fee (excess is refunded).

## License

MIT — © GEMBA IT.
