import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from '@web3-react/injected-connector';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';
import GladiatorArena from './GladiatorArena';
import WalletConnector from './components/WalletConnector';

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
      <ErrorBoundary
        FallbackComponent={({ error }) => (
          <div className="error-container">
            <h1>Something went wrong</h1>
            <p>{error.message}</p>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        )}
      >
        <div className="App">
          <WalletConnector />
          <GladiatorArena />
        </div>
      </ErrorBoundary>
    </Web3ReactProvider>
  );
}

export default App; 