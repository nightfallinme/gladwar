const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to Monad Testnet...");

  // Deploy GONAD
  const Gonad = await ethers.getContractFactory("Gonad");
  const gonad = await Gonad.deploy();
  await gonad.deployed();
  console.log("GONAD deployed to:", gonad.address);

  // Deploy Arena
  const GladiatorArena = await ethers.getContractFactory("GladiatorArena");
  const arena = await GladiatorArena.deploy(gonad.address);
  await arena.deployed();
  console.log("Arena deployed to:", arena.address);

  // Arena'yı initialize et (%50 supply)
  await gonad.initializeArena(arena.address);
  console.log("Sent 50% of GONAD supply to Arena");

  // Arena'ya reward pool için approve ver
  const rewardAmount = ethers.utils.parseEther("34710000"); // %50 supply
  await gonad.approve(arena.address, rewardAmount);
  console.log("Approved Arena for reward pool");

  // Arena'nın ödül havuzunu doldur
  await arena.addToRewardPool(rewardAmount);
  console.log("Added 34.71M GONAD to reward pool");

  // Token dağılımını kontrol et
  const arenaBalance = await gonad.balanceOf(arena.address);
  console.log("Arena Balance:", ethers.utils.formatEther(arenaBalance), "GONAD");

  const rewardPool = await arena.rewardPool();
  console.log("Arena Reward Pool:", ethers.utils.formatEther(rewardPool), "GONAD");

  // Deployment bilgilerini kaydet
  const deployments = {
    gonad: gonad.address,
    arena: arena.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  // Dosyaya kaydet
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deployments, null, 2)
  );

  console.log("Deployment info saved to:", `${deploymentsDir}/${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 