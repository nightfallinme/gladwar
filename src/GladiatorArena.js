import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './GladiatorArena.css';

function GladiatorArena({ provider, arenaContract, dominusContract }) {
  const [gladiator, setGladiator] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadGladiator();
  }, []);
  
  async function loadGladiator() {
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const glad = await arenaContract.getGladiator(address);
      setGladiator({
        name: glad.name,
        strength: glad.strength.toNumber(),
        stamina: glad.stamina.toNumber(),
        wins: glad.wins.toNumber(),
        losses: glad.losses.toNumber(),
        canTrain: glad.canTrain,
        canFight: glad.canFight
      });
    } catch (err) {
      console.error(err);
    }
  }
  
  async function createGladiator() {
    try {
      setLoading(true);
      const tx = await arenaContract.createGladiator(name);
      await tx.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function train() {
    try {
      setLoading(true);
      // Önce approve
      const tx1 = await dominusContract.approve(arenaContract.address, ethers.utils.parseEther("1"));
      await tx1.wait();
      // Sonra antrenman
      const tx2 = await arenaContract.train();
      await tx2.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function fight() {
    try {
      setLoading(true);
      // Random bir rakip seç
      const randomOpponent = "0x..."; // Burayı daha sonra düzenleyeceğiz
      
      // Önce approve
      const tx1 = await dominusContract.approve(arenaContract.address, ethers.utils.parseEther("5"));
      await tx1.wait();
      // Sonra dövüş
      const tx2 = await arenaContract.fight(randomOpponent);
      await tx2.wait();
      await loadGladiator();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (!gladiator) {
    return (
      <div className="arena">
        <h1>Gladiator Arena</h1>
        <div className="create-gladiator">
          <input 
            type="text" 
            placeholder="Gladiator Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={createGladiator} disabled={loading}>
            Create Gladiator
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="arena">
      <h1>Gladiator Arena</h1>
      <div className="gladiator-stats">
        <h2>{gladiator.name}</h2>
        <p>Strength: {gladiator.strength}</p>
        <p>Stamina: {gladiator.stamina}</p>
        <p>Wins: {gladiator.wins}</p>
        <p>Losses: {gladiator.losses}</p>
      </div>
      <div className="actions">
        <button 
          onClick={train} 
          disabled={loading || !gladiator.canTrain}
        >
          Train (1 DOM)
        </button>
        <button 
          onClick={fight} 
          disabled={loading || !gladiator.canFight}
        >
          Fight (5 DOM)
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default GladiatorArena; 