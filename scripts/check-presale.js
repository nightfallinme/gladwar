const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking Presale Status...");

  const DOMINUS_ADDRESS = "0xa8bDCE9Be409bfF34D1aeaDf418231B911cF00EB";
  const PRESALE_ADDRESS = "0x1e91D3dFe134481591a0C3a6b49cC24013403e02";

  const dominus = await ethers.getContractAt("Dominus", DOMINUS_ADDRESS);
  const presale = await ethers.getContractAt("DominusPresaleV3", PRESALE_ADDRESS);

  // Kontrat durumlarını kontrol et
  const signer = await ethers.getSigner();
  const userAddress = await signer.getAddress();

  // ETH Bakiyesi kontrolü
  const ethBalance = await ethers.provider.getBalance(userAddress);
  console.log("\nETH Balance:", ethers.utils.formatEther(ethBalance), "ETH");

  console.log("\nToken Balances:");
  console.log("User Balance:", ethers.utils.formatEther(await dominus.balanceOf(userAddress)));
  console.log("Presale Balance:", ethers.utils.formatEther(await dominus.balanceOf(PRESALE_ADDRESS)));
  
  console.log("\nAllowances:");
  console.log("Presale Allowance:", ethers.utils.formatEther(await dominus.allowance(userAddress, PRESALE_ADDRESS)));
  
  console.log("\nPresale Status:");
  console.log("Active:", await presale.presaleActive());
  console.log("Ended:", await presale.presaleEnded());
  console.log("Hard Cap:", ethers.utils.formatEther(await presale.hardCap()), "ETH");
  console.log("Total Tokens For Sale:", ethers.utils.formatEther(await presale.totalTokensForSale()));
  console.log("Total Tokens:", ethers.utils.formatEther(await presale.totalTokens()));
  console.log("Total Tokens Sold:", ethers.utils.formatEther(await presale.totalTokensSold()));
  console.log("Total ETH Raised:", ethers.utils.formatEther(await presale.totalEthRaised()));

  // Token fiyatını kontrol et
  const tokenPrice = await presale.TOKEN_PRICE();
  console.log("\nToken Price:", ethers.utils.formatEther(tokenPrice), "ETH");

  // Minimum ve maksimum alım miktarlarını kontrol et
  console.log("Min Amount:", ethers.utils.formatEther(await presale.minAmount()), "ETH");
  console.log("Max Amount:", ethers.utils.formatEther(await presale.maxAmount()), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 