// Multi-network wallet sweep - Check and transfer from all supported networks
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log(" MULTI-NETWORK WALLET SWEEP");
    console.log("=============================");
    
    const MAIN_ADDRESS = "0x8eB8Bf106EbC9834a2586D04F73866C7436Ce298";
    console.log("Target address:", MAIN_ADDRESS);
    
    // Network configurations
    const networks = [
        {
            name: "BSC Mainnet",
            chainId: 56,
            rpcUrl: "https://bsc-dataseed1.binance.org/",
            currency: "BNB",
            explorerUrl: "https://bscscan.com/tx/"
        },
        {
            name: "BSC Testnet", 
            chainId: 97,
            rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            currency: "BNB",
            explorerUrl: "https://testnet.bscscan.com/tx/"
        },
        {
            name: "Ethereum Mainnet",
            chainId: 1,
            rpcUrl: "https://mainnet.infura.io/v3/39a75c5f3c24451db6323e1b22f99fad", // Replace with actual key
            currency: "ETH",
            explorerUrl: "https://etherscan.io/tx/"
        },
        {
            name: "Ethereum Sepolia",
            chainId: 11155111,
            rpcUrl: "https://sepolia.infura.io/v3/39a75c5f3c24451db6323e1b22f99fad", // Replace with actual key
            currency: "ETH",
            explorerUrl: "https://sepolia.etherscan.io/tx/"
        },
        {
            name: "Polygon Mainnet",
            chainId: 137,
            rpcUrl: "https://polygon-rpc.com/",
            currency: "MATIC",
            explorerUrl: "https://polygonscan.com/tx/"
        },
        {
            name: "Polygon Amoy Testnet",
            chainId: 80002,
            rpcUrl: "https://rpc-amoy.polygon.technology/",
            currency: "MATIC",
            explorerUrl: "https://amoy.polygonscan.com/tx/"
        }
    ];
    
    // Load wallet file
    const walletsDir = path.join(__dirname, "../wallets");
    if (!fs.existsSync(walletsDir)) {
        throw new Error("No wallets directory found! Run generate-wallets.js first");
    }
    
    const walletFiles = fs.readdirSync(walletsDir)
        .filter(file => file.includes("evm-wallets-"))
        .sort((a, b) => b.localeCompare(a));
    
    if (walletFiles.length === 0) {
        throw new Error("No wallet files found! Run generate-wallets.js first");
    }
    
    const latestWalletFile = walletFiles[0];
    console.log("Loading wallets from:", latestWalletFile);
    
    const walletFilePath = path.join(walletsDir, latestWalletFile);
    const walletData = JSON.parse(fs.readFileSync(walletFilePath, "utf8"));
    
    console.log(`Found ${walletData.wallets.length} wallets to check across ${networks.length} networks`);
    
    const sweepResults = {
        targetAddress: MAIN_ADDRESS,
        sweepTime: new Date().toISOString(),
        totalWalletsChecked: walletData.wallets.length,
        networksChecked: networks.length,
        networkResults: []
    };
    
    let grandTotalSwept = BigInt(0);
    let totalSuccessfulTransfers = 0;
    
    // Check each network
    for (const networkConfig of networks) {
        console.log(`\n Checking ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
        console.log("=".repeat(50));
        
        try {
            // Create provider for this network
            const provider = new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl);
            
            // Test connection
            try {
                const blockNumber = await provider.getBlockNumber();
                console.log(`Connected to ${networkConfig.name} - Latest block: ${blockNumber}`);
            } catch (connectionError) {
                console.log(` Failed to connect to ${networkConfig.name}: ${connectionError.message}`);
                continue;
            }
            
            const networkResult = {
                networkName: networkConfig.name,
                chainId: networkConfig.chainId,
                currency: networkConfig.currency,
                walletsWithBalance: 0,
                totalSwept: "0",
                transactions: [],
                errors: []
            };
            
            let networkTotalSwept = BigInt(0);
            
            // Check each wallet on this network
            for (const walletInfo of walletData.wallets) {
                try {
                    console.log(`Checking Wallet ${walletInfo.id}: ${walletInfo.address}`);
                    
                    // Get balance
                    const balance = await provider.getBalance(walletInfo.address);
                    const balanceFormatted = hre.ethers.formatEther(balance);
                    
                    console.log(`Balance: ${balanceFormatted} ${networkConfig.currency}`);
                    
                    if (balance > 0) {
                        networkResult.walletsWithBalance++;
                        
                        // Create wallet instance
                        const wallet = new hre.ethers.Wallet(walletInfo.privateKey, provider);
                        
                        // Get gas price and estimate gas
                        const feeData = await provider.getFeeData();
                        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || hre.ethers.parseUnits("20", "gwei");
                        const gasLimit = BigInt(21000); // Standard transfer
                        const gasCost = gasLimit * gasPrice;
                        
                        console.log(`Gas cost: ${hre.ethers.formatEther(gasCost)} ${networkConfig.currency}`);
                        
                        if (balance > gasCost) {
                            // Calculate amount to send
                            const amountToSend = balance - gasCost;
                            
                            console.log(`Sending: ${hre.ethers.formatEther(amountToSend)} ${networkConfig.currency}`);
                            
                            // Send transaction
                            const tx = await wallet.sendTransaction({
                                to: MAIN_ADDRESS,
                                value: amountToSend,
                                gasLimit: gasLimit,
                                gasPrice: gasPrice
                            });
                            
                            console.log(`Transaction sent: ${tx.hash}`);
                            console.log(`Explorer: ${networkConfig.explorerUrl}${tx.hash}`);
                            console.log("Waiting for confirmation...");
                            
                            const receipt = await tx.wait();
                            
                            if (receipt.status === 1) {
                                console.log(" Transfer successful!");
                                networkTotalSwept += amountToSend;
                                totalSuccessfulTransfers++;
                                
                                networkResult.transactions.push({
                                    walletId: walletInfo.id,
                                    fromAddress: walletInfo.address,
                                    toAddress: MAIN_ADDRESS,
                                    amount: hre.ethers.formatEther(amountToSend),
                                    gasUsed: receipt.gasUsed.toString(),
                                    gasCost: hre.ethers.formatEther(gasCost),
                                    txHash: tx.hash,
                                    explorerUrl: networkConfig.explorerUrl + tx.hash,
                                    blockNumber: receipt.blockNumber,
                                    status: "success"
                                });
                            } else {
                                console.log(" Transfer failed!");
                                networkResult.transactions.push({
                                    walletId: walletInfo.id,
                                    fromAddress: walletInfo.address,
                                    amount: hre.ethers.formatEther(amountToSend),
                                    txHash: tx.hash,
                                    explorerUrl: networkConfig.explorerUrl + tx.hash,
                                    status: "failed",
                                    error: "Transaction reverted"
                                });
                            }
                        } else {
                            console.log("  Balance too low to cover gas costs");
                            networkResult.transactions.push({
                                walletId: walletInfo.id,
                                fromAddress: walletInfo.address,
                                balance: hre.ethers.formatEther(balance),
                                gasCost: hre.ethers.formatEther(gasCost),
                                status: "insufficient_for_gas",
                                error: "Balance lower than gas cost"
                            });
                        }
                    } else {
                        console.log("Empty wallet - skipping");
                    }
                    
                } catch (walletError) {
                    console.log(` Error processing wallet ${walletInfo.id}: ${walletError.message}`);
                    networkResult.errors.push({
                        walletId: walletInfo.id,
                        address: walletInfo.address,
                        error: walletError.message
                    });
                }
            }
            
            // Update network results
            networkResult.totalSwept = hre.ethers.formatEther(networkTotalSwept);
            sweepResults.networkResults.push(networkResult);
            
            console.log(`\n ${networkConfig.name} Summary:`);
            console.log(`Wallets with balance: ${networkResult.walletsWithBalance}`);
            console.log(`Total swept: ${networkResult.totalSwept} ${networkConfig.currency}`);
            console.log(`Successful transfers: ${networkResult.transactions.filter(tx => tx.status === 'success').length}`);
            
        } catch (networkError) {
            console.log(` Network error for ${networkConfig.name}: ${networkError.message}`);
            sweepResults.networkResults.push({
                networkName: networkConfig.name,
                chainId: networkConfig.chainId,
                status: "error",
                error: networkError.message
            });
        }
    }
    
    // Save comprehensive results
    const sweepResultsFile = path.join(walletsDir, `multi-network-sweep-${Date.now()}.json`);
    fs.writeFileSync(sweepResultsFile, JSON.stringify(sweepResults, null, 2));
    
    // Final summary
    console.log("\n MULTI-NETWORK SWEEP SUMMARY");
    console.log("==============================");
    console.log(`Networks checked: ${networks.length}`);
    console.log(`Total wallets checked: ${sweepResults.totalWalletsChecked}`);
    console.log(`Total successful transfers: ${totalSuccessfulTransfers}`);
    console.log(`Results saved to: ${sweepResultsFile}`);
    
    console.log("\n Per-Network Results:");
    sweepResults.networkResults.forEach(result => {
        if (result.status !== "error") {
            console.log(`${result.networkName}: ${result.totalSwept} ${result.currency} (${result.walletsWithBalance} wallets)`);
        } else {
            console.log(`${result.networkName}: ERROR - ${result.error}`);
        }
    });
    
    console.log("\n Notes:");
    console.log("- Ethereum networks require Infura API key in RPC URLs");
    console.log("- Some networks may be temporarily unavailable");
    console.log("- Gas costs vary significantly between networks");
    console.log("- Check explorer links in results file for transaction details");
    
    return sweepResults;
}

main()
    .then((results) => {
        console.log("\n Multi-network sweep completed!");
        console.log("Check the results file for detailed transaction information.");
        process.exit(0);
    })
    .catch((error) => {
        console.error(" Multi-network sweep failed:", error);
        process.exit(1);
    });
