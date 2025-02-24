import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './GladiatorArena.css';
import arenaImage from './assets/arena-pixel.png';

function GladiatorArena({ provider, arenaContract, gonadContract }) {
  const [gladiator, setGladiator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  useEffect(() => {
    loadGladiator();
    loadGonadStats();
    listenToEvents();
  }, []);

  // Event dinleyicileri
  function listenToEvents() {
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
  }

  async function loadGladiator() {
    try {
      const signer = provider.getSigner();
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
  }

  async function loadGonadStats() {
    try {
      const signer = provider.getSigner();
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
  }

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

  // Rakipleri yükle
  async function loadOpponents() {
    // Bu kısmı kontrata ekleyip implement edeceğiz
    const opponentList = await arenaContract.getActiveGladiators();
    setOpponents(opponentList);
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

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default GladiatorArena; 