import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import GladiatorArena from './GladiatorArena';
import arenaABI from './abis/GladiatorArena.json';
import dominusABI from './abis/Dominus.json';

const ARENA_ADDRESS = "YOUR_ARENA_CONTRACT_ADDRESS";
const DOMINUS_ADDRESS = "YOUR_DOMINUS_CONTRACT_ADDRESS";

function App() {
  const [provider, setProvider] = useState(null);
  const [arenaContract, setArenaContract] = useState(null);
  const [dominusContract, setDominusContract] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeEthers();
  }, []);

  async function initializeEthers() {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const arena = new ethers.Contract(ARENA_ADDRESS, arenaABI, signer);
        const dominus = new ethers.Contract(DOMINUS_ADDRESS, dominusABI, signer);

        setProvider(provider);
        setArenaContract(arena);
        setDominusContract(dominus);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect to wallet');
      console.error(err);
    }
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!provider || !arenaContract || !dominusContract) {
    return <div>Loading...</div>;
  }

  return (
    <GladiatorArena 
      provider={provider}
      arenaContract={arenaContract}
      dominusContract={dominusContract}
    />
  );
}

export default App; 