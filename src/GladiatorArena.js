import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import './GladiatorArena.css';
import { injected } from './App';

function GladiatorArena() {
  const { account, library, activate, active } = useWeb3React();

  const [arenaContract, setArenaContract] = useState(null);
  const [gonadContract, setGonadContract] = useState(null);

  const [gladiator, setGladiator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [taunt, setTaunt] = useState('');
  const [opponents, setOpponents] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGladiator, setNewGladiator] = useState({
    name: '',
    battleCry: '',
    pose: ''
  });
  const [gonadStats, setGonadStats] = useState({
    flexCount: 0,
    timeUntilNextFlex: 0,
    catchPhrase: '',
    isRugPullVictim: false,
    memeScore: 0
  });
  const [memeWall, setMemeWall] = useState([]);
  const [newMeme, setNewMeme] = useState('');
  const [presaleAmount, setPresaleAmount] = useState(1);
  const [presaleInfo, setPresaleInfo] = useState({
    totalSold: 0,
    price: 0,
    maxPerUser: 0
  });
  const [limits, setLimits] = useState({
    allowance: 0,
    balance: 0,
    fightCost: 0,
    trainingCost: 0
  });

  // Kontratları oluştur
  useEffect(() => {
    if (library && active) {
      try {
        console.log("Creating contracts...");
        const signer = library.getSigner();
        const arenaAbi = require('./abis/GladiatorArena.json').abi;
        const gonadAbi = require('./abis/Gonad.json').abi;

        console.log("Arena Address:", process.env.REACT_APP_ARENA_ADDRESS);
        console.log("GONAD Address:", process.env.REACT_APP_GONAD_ADDRESS);

        const arena = new ethers.Contract(
          process.env.REACT_APP_ARENA_ADDRESS,
          arenaAbi,
          signer
        );
        setArenaContract(arena);

        const gonad = new ethers.Contract(
          process.env.REACT_APP_GONAD_ADDRESS,
          gonadAbi,
          signer
        );
        setGonadContract(gonad);

        console.log("Contracts created successfully!");
      } catch (err) {
        console.error("Error creating contracts:", err);
        setError(err.message);
      }
    }
  }, [library, active]);

  // Önce fonksiyonları tanımlayalım
  const listenToEvents = useCallback(() => {
    arenaContract.on("Fight", (challenger, opponent, winner, epicMoment) => {
      setBattleLog(prev => [`🗡️ ${epicMoment}`, ...prev.slice(0, 4)]);
    });

    arenaContract.on("CrowdGoesWild", (gladiator, underwearCount) => {
      setBattleLog(prev => [`👙 Crowd throws ${underwearCount} underwear!`, ...prev.slice(0, 4)]);
    });

    arenaContract.on("EpicFlexFail", (gladiator, failDescription) => {
      setBattleLog(prev => [`💪 FAIL: ${failDescription}`, ...prev.slice(0, 4)]);
    });

    gonadContract.on("FlexFailed", (flexer, reason) => {
      setBattleLog(prev => [`💪 ${reason}`, ...prev.slice(0, 4)]);
    });

    gonadContract.on("MemePosted", (poster, message) => {
      setMemeWall(prev => [{ poster, message, time: Date.now() }, ...prev.slice(0, 9)]);
    });

    gonadContract.on("GigaChad", (chad, flexPower) => {
      setBattleLog(prev => [`🦾 GIGACHAD FLEX: ${flexPower}`, ...prev.slice(0, 4)]);
    });

    gonadContract.on("Rugpull", (victim, lastWords) => {
      setBattleLog(prev => [`😱 RUG PULL: ${lastWords}`, ...prev.slice(0, 4)]);
    });
  }, [arenaContract, setBattleLog]);

  const loadGladiator = useCallback(async () => {
    try {
      const signer = library.getSigner();
      const address = await signer.getAddress();
      
      const basicStats = await arenaContract.getGladiatorBasicStats(address);
      const extraStats = await arenaContract.getGladiatorExtraStats(address);
      
      if (basicStats.strength.toNumber() > 0) {
        setGladiator({
          name: basicStats.name,
          strength: basicStats.strength.toNumber(),
          stamina: basicStats.stamina.toNumber(),
          wins: basicStats.wins.toNumber(),
          losses: basicStats.losses.toNumber(),
          battleCry: extraStats.battleCry,
          favoritePose: extraStats.favoritePose,
          fanCount: extraStats.fanCount.toNumber(),
          isNaked: extraStats.isNaked,
          underwearCount: extraStats.underwearCount.toNumber()
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [library, arenaContract]);

  const loadGonadStats = useCallback(async () => {
    try {
      const signer = library.getSigner();
      const address = await signer.getAddress();
      const stats = await gonadContract.getFlexStatus(address);
      
      setGonadStats({
        flexCount: stats.dailyFlexes.toNumber(),
        timeUntilNextFlex: stats.timeUntilNextFlex.toNumber(),
        catchPhrase: stats.catchPhrase,
        isRugPullVictim: stats.rugPullVictim,
        memeScore: stats.memeScore.toNumber()
      });
    } catch (err) {
      console.error(err);
    }
  }, [library, gonadContract]);

  const loadPresaleInfo = useCallback(async () => {
    try {
      const totalSold = await gonadContract.totalPresaleSold();
      const price = await gonadContract.PRESALE_PRICE();
      const maxPerUser = await gonadContract.MAX_PRESALE_PER_USER();
      
      setPresaleInfo({
        totalSold: ethers.utils.formatEther(totalSold),
        price: ethers.utils.formatEther(price),
        maxPerUser: ethers.utils.formatEther(maxPerUser)
      });
    } catch (err) {
      console.error(err);
    }
  }, [gonadContract]);

  const loadLimits = useCallback(async () => {
    try {
      const signer = library.getSigner();
      const userLimits = await arenaContract.checkUserLimits(await signer.getAddress());
      setLimits({
        allowance: ethers.utils.formatEther(userLimits.allowance),
        balance: ethers.utils.formatEther(userLimits.balance),
        fightCost: ethers.utils.formatEther(userLimits.fightCost),
        trainingCost: ethers.utils.formatEther(userLimits.trainingCost)
      });
    } catch (err) {
      console.error(err);
    }
  }, [library, arenaContract, gonadContract]);

  // Sonra useEffect
  useEffect(() => {
    const init = async () => {
      await loadGladiator();
      await loadGonadStats();
      await loadPresaleInfo();
      await loadLimits();
      listenToEvents();
    };
    init();
  }, [loadGladiator, loadGonadStats, loadPresaleInfo, loadLimits, listenToEvents]);

  // Connect wallet fonksiyonu
  const connectWallet = useCallback(async () => {
    try {
      await activate(injected);
    } catch (err) {
      setError(err.message);
    }
  }, [activate]);

  async function createGladiator() {
    try {
      setLoading(true);
      const tx = await arenaContract.createGladiator(
        newGladiator.name,
        newGladiator.battleCry,
        newGladiator.pose
      );
      await tx.wait();
      await loadGladiator();
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function train() {
    try {
      setLoading(true);
      const tx1 = await gonadContract.approve(arenaContract.address, ethers.utils.parseEther("1"));
      await tx1.wait();
      const tx2 = await arenaContract.train();
      await tx2.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fight(opponent) {
    try {
      setLoading(true);
      const tx1 = await gonadContract.approve(arenaContract.address, ethers.utils.parseEther("5"));
      await tx1.wait();
      const tx2 = await arenaContract.fight(opponent, taunt);
      await tx2.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleNaked() {
    try {
      setLoading(true);
      const tx = await arenaContract.toggleNakedMode();
      await tx.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function flex() {
    try {
      setLoading(true);
      const tx = await gonadContract.flexOnThem();
      await tx.wait();
      await loadGonadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function postMeme() {
    try {
      setLoading(true);
      const tx = await gonadContract.postMeme(newMeme);
      await tx.wait();
      setNewMeme('');
      await loadGonadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function buyPresale() {
    try {
      setLoading(true);
      const tx = await gonadContract.buyPresale({ 
        value: ethers.utils.parseEther(presaleAmount.toString()) 
      });
      await tx.wait();
      await loadPresaleInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimAirdrop() {
    try {
      setLoading(true);
      const tx = await gonadContract.claimAirdrop();
      await tx.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMaxApprove() {
    try {
      setLoading(true);
      setError('');
      const tx = await arenaContract.maxApprove();
      await tx.wait();
      setSuccess('Max approve successful! You can now use the arena freely.');
      await loadLimits();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Eğer cüzdan bağlı değilse
  if (!active) {
    return (
      <div className="loading-container">
        <h1>Welcome to GONAD Arena</h1>
        <p>Please connect your wallet to continue</p>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    );
  }

  if (!gladiator && !showCreateForm) {
    return (
      <div className="arena-welcome">
        <h1>🗡️ GONAD ARENA 🛡️</h1>
        <div className="pixel-art-arena"></div>
        <button className="create-button" onClick={() => setShowCreateForm(true)}>
          Create Your Gladiator
        </button>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="arena-create">
        <h1>Create Your Champion</h1>
        <div className="create-form">
          <input
            placeholder="Gladiator Name"
            value={newGladiator.name}
            onChange={(e) => setNewGladiator({...newGladiator, name: e.target.value})}
          />
          <input
            placeholder="Battle Cry (e.g. FOR GONAD!)"
            value={newGladiator.battleCry}
            onChange={(e) => setNewGladiator({...newGladiator, battleCry: e.target.value})}
          />
          <input
            placeholder="Favorite Pose"
            value={newGladiator.pose}
            onChange={(e) => setNewGladiator({...newGladiator, pose: e.target.value})}
          />
          <button onClick={createGladiator} disabled={loading}>
            Enter the Arena!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="arena">
      {/* Allowance Warning */}
      {limits.allowance < limits.fightCost && (
        <div className="warning-card">
          <h3>⚠️ Allowance Required</h3>
          <p>Arena needs your approval to use GONAD tokens.</p>
          <button onClick={handleMaxApprove} disabled={loading}>
            {loading ? 'Approving...' : 'Approve Arena (Max)'}
          </button>
        </div>
      )}

      {/* Balance Info */}
      <div className="balance-card">
        <h3>💰 Your GONAD</h3>
        <p>Balance: {limits.balance} GONAD</p>
        <p>Allowance: {limits.allowance} GONAD</p>
        <p>Fight Cost: {limits.fightCost} GONAD</p>
        <p>Training Cost: {limits.trainingCost} GONAD</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="gladiator-card">
        <h2>{gladiator.name}</h2>
        <div className="stats">
          <div className="stat">
            <span>💪 Strength</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{width: `${gladiator.strength}%`}}></div>
            </div>
          </div>
          <div className="stat">
            <span>⚡ Stamina</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{width: `${gladiator.stamina}%`}}></div>
            </div>
          </div>
        </div>
        
        <div className="achievements">
          <p>🏆 Wins: {gladiator.wins}</p>
          <p>💀 Losses: {gladiator.losses}</p>
          <p>👥 Fans: {gladiator.fanCount}</p>
          <p>👙 Underwear Collection: {gladiator.underwearCount}</p>
        </div>

        <div className="battle-cry">
          <p>"{gladiator.battleCry}"</p>
          <p>Signature Move: {gladiator.favoritePose}</p>
        </div>

        <div className="actions">
          <button onClick={train} disabled={loading}>
            Train (1 GONAD) 💪
          </button>
          <button 
            onClick={toggleNaked} 
            className={gladiator.isNaked ? 'naked' : ''}
            disabled={loading}
          >
            {gladiator.isNaked ? '🍑 Put Clothes On' : '👙 Fight Naked (+20% Power)'}
          </button>
        </div>
      </div>

      <div className="gonad-stats-card">
        <h3>💪 GONAD Power</h3>
        <div className="stats">
          <p>Daily Flexes: {gonadStats.flexCount}/42</p>
          <p>Next Flex: {Math.floor(gonadStats.timeUntilNextFlex / 60)} mins</p>
          <p>Catch Phrase: "{gonadStats.catchPhrase}"</p>
          <p>Meme Score: {gonadStats.memeScore}</p>
          {gonadStats.isRugPullVictim && (
            <p className="rug-pull-victim">🚩 Rug Pull Survivor</p>
          )}
        </div>
        <button onClick={flex} disabled={loading || gonadStats.timeUntilNextFlex > 0}>
          FLEX ON THEM 💪
        </button>
      </div>

      <div className="meme-wall">
        <h3>🎭 Meme Wall</h3>
        <div className="post-meme">
          <input
            placeholder="Post your meme (might get bonus GONAD)"
            value={newMeme}
            onChange={(e) => setNewMeme(e.target.value)}
          />
          <button onClick={postMeme} disabled={loading}>
            Post Meme 🎭
          </button>
        </div>
        <div className="memes">
          {memeWall.map((meme, i) => (
            <div key={i} className="meme">
              <p>{meme.message}</p>
              <small>Posted by: {meme.poster.slice(0,6)}...{meme.poster.slice(-4)}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="battle-section">
        <h3>Battle Arena</h3>
        <input
          placeholder="Your Battle Taunt (longer = more power!)"
          value={taunt}
          onChange={(e) => setTaunt(e.target.value)}
        />
        <div className="opponents">
          {opponents.map(opp => (
            <div key={opp.address} className="opponent-card">
              <h4>{opp.name}</h4>
              <p>Strength: {opp.strength}</p>
              <button onClick={() => fight(opp.address)} disabled={loading}>
                Fight! (5 GONAD)
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="battle-log">
        <h3>Arena Highlights</h3>
        {battleLog.map((log, i) => (
          <p key={i} className="log-entry">{log}</p>
        ))}
      </div>

      {/* Presale Card */}
      <div className="presale-card">
        <h3>🚀 GONAD Presale</h3>
        <div className="stats">
          <p>Price: 1 TMON = 1000 GONAD</p>
          <p>Total Sold: {presaleInfo.totalSold} / 20.826M GONAD</p>
          <p>Max Per User: {presaleInfo.maxPerUser} GONAD</p>
        </div>
        <div className="buy-form">
          <input
            type="number"
            min="1"
            max="1000"
            value={presaleAmount}
            onChange={(e) => setPresaleAmount(e.target.value)}
            placeholder="TMON Amount"
          />
          <button onClick={buyPresale} disabled={loading}>
            Buy GONAD 🚀
          </button>
        </div>
      </div>

      {/* Airdrop Card */}
      <div className="airdrop-card">
        <h3>🎁 Free GONAD</h3>
        <p>Claim 10 GONAD tokens to start your journey!</p>
        <button onClick={claimAirdrop} disabled={loading}>
          Claim Airdrop 🎁
        </button>
      </div>
    </div>
  );
}

export default GladiatorArena; 