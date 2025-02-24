const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Presale on Monad Testnet...");

  // Kontrat adreslerini alın
  const DOMINUS_ADDRESS = "0xa8bDCE9Be409bfF34D1aeaDf418231B911cF00EB";
  const PRESALE_ADDRESS = "0x1e91D3dFe134481591a0C3a6b49cC24013403e02";

  // Kontratları bağla
  const dominus = await ethers.getContractAt("Dominus", DOMINUS_ADDRESS);
  const presale = await ethers.getContractAt("DominusPresaleV3", PRESALE_ADDRESS);

  // Token miktarını kontrol et
  const balance = await dominus.balanceOf(await (await ethers.getSigner()).getAddress());
  console.log("Token balance:", ethers.utils.formatEther(balance));

  // Presale kontratına token approve et
  const totalTokens = ethers.utils.parseEther("1000000"); // 1 milyon token
  console.log("Approving tokens for presale contract...");
  const approveTx = await dominus.approve(PRESALE_ADDRESS, totalTokens);
  await approveTx.wait();
  console.log("Tokens approved");

  // Presale'i başlat
  console.log("Starting presale with", ethers.utils.formatEther(totalTokens), "tokens");
  const startTx = await presale.startPresale(totalTokens);
  await startTx.wait();
  console.log("Presale started");

  // Test satın alma
  const buyAmount = ethers.utils.parseEther("0.001"); // 0.001 ETH ile test
  console.log("Buying tokens with", ethers.utils.formatEther(buyAmount), "ETH");
  const buyTx = await presale.buyTokens({ value: buyAmount });
  await buyTx.wait();
  console.log("Tokens purchased");

  // Durum kontrolü
  const totalTokensSold = await presale.totalTokensSold();
  const totalEthRaised = await presale.totalEthRaised();
  
  console.log("Total tokens sold:", ethers.utils.formatEther(totalTokensSold));
  console.log("Total ETH raised:", ethers.utils.formatEther(totalEthRaised));

  // Token bakiyelerini kontrol et
  const userBalance = await dominus.balanceOf(await (await ethers.getSigner()).getAddress());
  const presaleBalance = await dominus.balanceOf(PRESALE_ADDRESS);
  console.log("User token balance:", ethers.utils.formatEther(userBalance));
  console.log("Presale contract token balance:", ethers.utils.formatEther(presaleBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 