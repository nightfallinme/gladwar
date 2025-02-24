import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from '@web3-react/injected-connector';
import './App.css';
import GladiatorArena from './GladiatorArena';

// Monad Testnet için connector
export const injected = new InjectedConnector({
  supportedChainIds: [10143], // Monad Testnet
});

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="App">
        <GladiatorArena />
      </div>
    </Web3ReactProvider>
  );
}

export default App; 