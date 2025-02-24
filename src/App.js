import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import GladiatorArena from './GladiatorArena';
import arenaABI from './abis/GladiatorArena.json';
import gonadABI from './abis/Gonad.json';

const ARENA_ADDRESS = process.env.REACT_APP_ARENA_ADDRESS;
const GONAD_ADDRESS = process.env.REACT_APP_GONAD_ADDRESS;

function App() {
  const [provider, setProvider] = useState(null);
  const [arenaContract, setArenaContract] = useState(null);
  const [gonadContract, setGonadContract] = useState(null);
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
        const gonad = new ethers.Contract(GONAD_ADDRESS, gonadABI, signer);

        setProvider(provider);
        setArenaContract(arena);
        setGonadContract(gonad);
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

  if (!provider || !arenaContract || !gonadContract) {
    return <div>Loading...</div>;
  }

  return (
    <GladiatorArena 
      provider={provider}
      arenaContract={arenaContract}
      gonadContract={gonadContract}
    />
  );
}

export default App; 