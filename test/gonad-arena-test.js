const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("GONAD ve Arena Tests", function () {
  let Gonad, gonad, GladiatorArena, arena;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Deploy contracts
    Gonad = await ethers.getContractFactory("Gonad");
    gonad = await Gonad.deploy();
    await gonad.deployed();

    GladiatorArena = await ethers.getContractFactory("GladiatorArena");
    arena = await GladiatorArena.deploy(gonad.address);
    await gonad.initializeArena(arena.address);
  });

  describe("GONAD Token Tests", function () {
    it("Token ekonomisi doğru dağıtılmış", async function () {
      const arenaBalance = await gonad.balanceOf(arena.address);
      const ownerBalance = await gonad.balanceOf(owner.address);
      
      expect(arenaBalance).to.equal(ethers.utils.parseEther("34710000")); // %50
      expect(ownerBalance).to.equal(ethers.utils.parseEther("34710000")); // Kalan %50
    });

    it("Presale çalışıyor", async function () {
      const buyAmount = ethers.utils.parseEther("1"); // 1 MON
      await gonad.connect(addr1).buyPresale({ value: buyAmount });
      
      const balance = await gonad.balanceOf(addr1.address);
      expect(balance).to.equal(buyAmount.mul(ethers.BigNumber.from("1000"))); // 1 MON = 1000 GONAD
    });

    it("Airdrop çalışıyor", async function () {
      await gonad.connect(addr1).claimAirdrop();
      
      const balance = await gonad.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.utils.parseEther("10")); // 10 GONAD
      
      await expect(
        gonad.connect(addr1).claimAirdrop()
      ).to.be.revertedWith("Already claimed");
    });

    it("Flex mekanizması çalışıyor", async function () {
      await gonad.transfer(addr1.address, ethers.utils.parseEther("1000"));
      
      await gonad.connect(addr1).flexOnThem();
      const stats = await gonad.getFlexStatus(addr1.address);
      expect(stats.dailyFlexes).to.equal(1);
      
      await expect(
        gonad.connect(addr1).flexOnThem()
      ).to.be.revertedWith("Bro chill with the flexing");
    });

    it("Rug pull mekanizması çalışıyor", async function () {
      await gonad.transfer(addr1.address, ethers.utils.parseEther("1000"));
      
      // Rug pull olana kadar transfer dene
      let isRugged = false;
      for(let i = 0; i < 200 && !isRugged; i++) {
        await gonad.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("1"));
        const stats = await gonad.getFlexStatus(addr1.address);
        isRugged = stats.rugPullVictim;
      }
      
      expect(isRugged).to.be.true;
    });
  });

  describe("Arena Tests", function () {
    beforeEach(async function () {
      // Setup gladiators
      await gonad.transfer(addr1.address, ethers.utils.parseEther("1000"));
      await arena.connect(addr1).maxApprove(); // Tek seferde max allowance
      await arena.connect(addr1).createGladiator("Chad", "FLEX!", "Double Biceps");
      
      await gonad.transfer(addr2.address, ethers.utils.parseEther("1000"));
      await arena.connect(addr2).maxApprove(); // Tek seferde max allowance
      await arena.connect(addr2).createGladiator("Virgin", "pls no hurt", "T-Pose");

      // Arena'ya ödül havuzu ekle (owner'dan)
      await arena.maxApprove(); // Owner için max allowance
      await arena.addToRewardPool(ethers.utils.parseEther("10000")); // 10,000 GONAD
    });

    it("Training sistemi çalışıyor", async function () {
      const beforeStats = await arena.getGladiatorBasicStats(addr1.address);
      await arena.connect(addr1).train();
      const afterStats = await arena.getGladiatorBasicStats(addr1.address);
      
      expect(afterStats.strength).to.be.gt(beforeStats.strength);
      expect(afterStats.stamina).to.be.gt(beforeStats.stamina);
    });

    it("Çıplak dövüş bonusu çalışıyor", async function () {
      await arena.connect(addr1).toggleNakedMode();
      
      const stats = await arena.getGladiatorExtraStats(addr1.address);
      expect(stats.isNaked).to.be.true;
      
      // Fight için approve
      await gonad.connect(addr1).approve(arena.address, ethers.utils.parseEther("5")); // 5 GONAD fight fee
      await gonad.connect(addr2).approve(arena.address, ethers.utils.parseEther("5")); // opponent da approve etmeli
      
      // Dövüş yap ve bonus kontrol et
      await arena.connect(addr1).fight(addr2.address, "GET REKT!");
      const afterStats = await arena.getGladiatorBasicStats(addr1.address);
      expect(afterStats.wins).to.equal(1);
    });

    it("Fan sistemi çalışıyor", async function () {
      // Fight için approve
      await gonad.connect(addr1).approve(arena.address, ethers.utils.parseEther("50")); // 5 GONAD * 10 fights
      await gonad.connect(addr2).approve(arena.address, ethers.utils.parseEther("50")); // opponent da approve etmeli
      
      // Allowance kontrol
      const limits = await arena.checkUserLimits(addr1.address);
      expect(limits.allowance).to.equal(ethers.utils.parseEther("50"));
      
      // Birkaç dövüş yap
      for(let i = 0; i < 10; i++) {
        await arena.connect(addr1).fight(addr2.address, "FLEX!");
        // 1 saat bekle
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");
      }
      
      const stats = await arena.getGladiatorExtraStats(addr1.address);
      expect(stats.fanCount).to.be.gt(0);
      expect(stats.underwearCount).to.be.gt(0);
    });

    it("Epic moment sistemi çalışıyor", async function () {
      const longTaunt = "THIS IS SPARTA! ".repeat(10); // Uzun taunt = daha fazla güç
      await arena.connect(addr1).fight(addr2.address, longTaunt);
      
      const stats = await arena.getGladiatorBasicStats(addr1.address);
      expect(stats.wins).to.equal(1); // Uzun taunt ile kazanmalı
    });
  });
}); 