// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

interface IGonad {
    // Token Ekonomisi
    function TOTAL_SUPPLY() external view returns (uint256);
    function ARENA_ALLOCATION() external view returns (uint256);
    function PRESALE_ALLOCATION() external view returns (uint256);
    function AIRDROP_ALLOCATION() external view returns (uint256);
    
    // Kullanıcı Limitleri
    function DAILY_FLEX_LIMIT() external view returns (uint256);
    function PRESALE_PRICE() external view returns (uint256);
    function MAX_PRESALE_PER_USER() external view returns (uint256);
    function AIRDROP_AMOUNT() external view returns (uint256);
    
    // Core Fonksiyonlar
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // Presale & Airdrop
    function buyPresale() external payable;
    function claimAirdrop() external;
    function totalPresaleSold() external view returns (uint256);
    function totalAirdropClaimed() external view returns (uint256);
    function hasClaimedAirdrop(address user) external view returns (bool);
    
    // Arena Özellikleri
    function flexOnThem() external;
    function setCatchPhrase(string memory phrase) external;
    function postMeme(string memory meme) external;
    function getFlexStatus(address flexer) external view returns (
        uint256 dailyFlexes,
        uint256 timeUntilNextFlex,
        string memory catchPhrase,
        bool rugPullVictim,
        uint256 memeScore
    );
} 