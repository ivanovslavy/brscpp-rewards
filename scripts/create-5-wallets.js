// Generate 5 EVM wallet addresses with private keys and mnemonic phrases
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
    console.log(" GENERATING 5 EVM WALLET ADDRESSES");
    console.log("===================================");

    const wallets = [];

    // Generate 5 wallets
    for (let i = 1; i <= 5; i++) {
        console.log(`\nGenerating Wallet ${i}...`);
        
        // Generate random wallet
        const wallet = hre.ethers.Wallet.createRandom();
        
        // Get wallet details
        const address = wallet.address;
        const privateKey = wallet.privateKey;
        const mnemonic = wallet.mnemonic.phrase;
        
        console.log(`Address: ${address}`);
        console.log(`Private Key: ${privateKey}`);
        console.log(`Mnemonic: ${mnemonic}`);
        
        // Store wallet info
        wallets.push({
            id: i,
            address: address,
            privateKey: privateKey,
            mnemonic: mnemonic,
            generatedAt: new Date().toISOString()
        });
    }

    // Create wallets directory if it doesn't exist
    const walletsDir = path.join(__dirname, "../wallets");
    if (!fs.existsSync(walletsDir)) {
        fs.mkdirSync(walletsDir, { recursive: true });
    }

    // Save to JSON file
    const timestamp = Date.now();
    const walletsFile = path.join(walletsDir, `evm-wallets-${timestamp}.json`);
    
    const walletsData = {
        description: "Generated EVM wallet addresses with private keys and mnemonic phrases",
        network: "EVM Compatible (Ethereum, BSC, Polygon, etc.)",
        generatedAt: new Date().toISOString(),
        totalWallets: wallets.length,
        wallets: wallets,
        securityWarning: "KEEP THESE PRIVATE KEYS SECURE! Anyone with access to these keys can control the funds in these wallets.",
        usage: {
            metamask: "Import using private key or mnemonic phrase",
            hardhat: "Add private keys to hardhat.config.js accounts array",
            web3: "Use private keys to create wallet instances"
        }
    };

    fs.writeFileSync(walletsFile, JSON.stringify(walletsData, null, 2));

    console.log("\n WALLET GENERATION COMPLETE!");
    console.log("==============================");
    console.log(`Generated ${wallets.length} wallets`);
    console.log(`Saved to: ${walletsFile}`);
    
    console.log("\n WALLET SUMMARY:");
    wallets.forEach((wallet, index) => {
        console.log(`Wallet ${wallet.id}: ${wallet.address}`);
    });

    console.log("\n SECURITY REMINDERS:");
    console.log("- NEVER share private keys publicly");
    console.log("- Store private keys in secure location");
    console.log("- Use environment variables for production");
    console.log("- These wallets start with 0 balance");
    
    console.log("\n📱 USAGE EXAMPLES:");
    console.log("Metamask Import:");
    console.log("- Go to Account Menu > Import Account");
    console.log("- Select 'Private Key' and paste private key");
    console.log("- Or use 'Secret Recovery Phrase' with mnemonic");
    
    console.log("\nHardhat Configuration:");
    console.log("Add to hardhat.config.js:");
    console.log("accounts: [");
    wallets.forEach((wallet, index) => {
        console.log(`  "${wallet.privateKey}",`);
    });
    console.log("]");

    console.log("\n FUNDING WALLETS:");
    console.log("For BSC Testnet: https://testnet.binance.org/faucet-smart");
    console.log("For Ethereum Goerli: https://goerlifaucet.com/");
    console.log("For Polygon Mumbai: https://faucet.polygon.technology/");

    return walletsFile;
}

main()
    .then((walletsFile) => {
        console.log(`\n Wallets successfully generated and saved to: ${walletsFile}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(" Wallet generation failed:", error);
        process.exit(1);
    });
