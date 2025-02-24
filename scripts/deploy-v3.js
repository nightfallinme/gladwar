const hre = require("hardhat");

// Monad Testnet adresleri
const FACTORY = "0x961235a9020b05c44df1026d956d1f4d78014276";
const NONFUNGIBLE_POSITION_MANAGER = "0x3dcc735c74f10fe2b9db2bb55c40fbbbf24490f7";
const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";
const WETH = "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37";

async function main() {
  console.log("Deploying contracts to Monad Testnet...");

  // Deploy Dominus token
  const Dominus = await hre.ethers.getContractFactory("Dominus");
  const dominus = await Dominus.deploy();
  await dominus.deployed();
  console.log("Dominus token deployed to:", dominus.address);

  // Deploy DominusPresaleV3
  const DominusPresaleV3 = await hre.ethers.getContractFactory("DominusPresaleV3");
  const presale = await DominusPresaleV3.deploy(
    dominus.address,
    FACTORY,
    NONFUNGIBLE_POSITION_MANAGER,
    PERMIT2,
    WETH
  );
  await presale.deployed();
  console.log("DominusPresaleV3 deployed to:", presale.address);

  // Presale kontratı için approve işlemi
  const approveTx = await dominus.approve(presale.address, ethers.constants.MaxUint256);
  await approveTx.wait();
  console.log("Presale contract approved for transfers");

  // Deployment bilgilerini kaydet
  const deploymentInfo = {
    dominusAddress: dominus.address,
    presaleAddress: presale.address,
    network: "Monad Testnet",
    chainId: 10143
  };

  console.log("Deployment Info:", deploymentInfo);

  // Kontratları doğrula
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Verifying contracts on explorer...");
    
    await hre.run("verify:verify", {
      address: dominus.address,
      contract: "contracts/Dominus.sol:Dominus",
    });

    await hre.run("verify:verify", {
      address: presale.address,
      contract: "contracts/DominusPresaleV3.sol:DominusPresaleV3",
      constructorArguments: [
        dominus.address,
        FACTORY,
        NONFUNGIBLE_POSITION_MANAGER,
        PERMIT2,
        WETH
      ],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 