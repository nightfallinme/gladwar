import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from '@web3-react/injected-connector';
import './App.css';
import GladiatorArena from './GladiatorArena';
import WalletConnector from './components/WalletConnector';
import { ErrorBoundary } from 'react-error-boundary';

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
      <ErrorBoundary>
        <div className="App">
          <WalletConnector />
          <GladiatorArena />
        </div>
      </ErrorBoundary>
    </Web3ReactProvider>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App; 