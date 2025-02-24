import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import GladiatorArena from './GladiatorArena';

function App() {
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [arenaContract, setArenaContract] = useState(null);
  const [gonadContract, setGonadContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Provider kontrolü
        if (!window.ethereum) {
          throw new Error("Please install MetaMask!");
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Chain ID kontrolü
        const network = await provider.getNetwork();
        if (network.chainId !== 10143) {
          throw new Error("Please connect to Monad Testnet!");
        }

        // Kontratları yükle
        const arenaAbi = require('./abis/GladiatorArena.json').abi;
        const gonadAbi = require('./abis/Gonad.json').abi;

        const arena = new ethers.Contract(
          process.env.REACT_APP_ARENA_ADDRESS,
          arenaAbi,
          provider.getSigner()
        );
        setArenaContract(arena);

        const gonad = new ethers.Contract(
          process.env.REACT_APP_GONAD_ADDRESS,
          gonadAbi,
          provider.getSigner()
        );
        setGonadContract(gonad);

      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!provider || !arenaContract || !gonadContract) {
    return (
      <div className="loading-container">
        <h1>Loading...</h1>
        <p>Please connect your wallet to Monad Testnet</p>
      </div>
    );
  }

  return (
    <div className="App">
      <GladiatorArena 
        provider={provider}
        arenaContract={arenaContract}
        gonadContract={gonadContract}
      />
    </div>
  );
}

export default App; 