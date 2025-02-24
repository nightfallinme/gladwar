import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../App';

function WalletConnector() {
  const { active, account, chainId, activate, deactivate } = useWeb3React();

  // Monad Testnet'e geçiş yap
  const switchToMonad = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }], // 10143 in hex
      });
    } catch (switchError) {
      // Ağ ekli değilse ekle
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x279F',
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'TMON',
                symbol: 'TMON',
                decimals: 18
              },
              rpcUrls: ['https://rpc.testnet.monad.xyz'],
              blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
            }]
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  };

  // Cüzdan bağla
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (err) {
      console.error(err);
    }
  };

  // Cüzdan bağlantısını kes
  const disconnectWallet = () => {
    try {
      deactivate();
    } catch (err) {
      console.error(err);
    }
  };

  // Ağ kontrolü
  useEffect(() => {
    if (active && chainId !== 10143) {
      switchToMonad();
    }
  }, [active, chainId]);

  return (
    <div className="wallet-connector">
      {active ? (
        <div className="wallet-info">
          <span>Connected: {account.slice(0,6)}...{account.slice(-4)}</span>
          {chainId !== 10143 && (
            <button onClick={switchToMonad}>Switch to Monad</button>
          )}
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}

export default WalletConnector; 