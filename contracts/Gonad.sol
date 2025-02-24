// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Gonad is ERC20, Ownable {
    // Token Ekonomisi
    uint256 public constant TOTAL_SUPPLY = 69_420_000 * 10**18;  // 69.42M GONAD
    uint256 public constant ARENA_ALLOCATION = 34_710_000 * 10**18;  // %50 Arena için
    uint256 public constant PRESALE_ALLOCATION = 20_826_000 * 10**18;  // %30 Presale
    uint256 public constant AIRDROP_ALLOCATION = 6_942_000 * 10**18;  // %10 Airdrop

    // Kullanıcı limitleri
    uint256 public constant DAILY_FLEX_LIMIT = 42;
    uint256 public constant PRESALE_PRICE = 1 * 10**18;  // 1 MON
    uint256 public constant GONAD_PER_MON = 1000;  // 1 MON = 1000 GONAD
    uint256 public constant MAX_PRESALE_PER_USER = 1000 * 10**18;  // Kişi başı max 1000 GONAD
    uint256 public constant AIRDROP_AMOUNT = 10 * 10**18;  // 10 GONAD airdrop

    // Events
    event Presale(address indexed buyer, uint256 amount);
    event Airdrop(address indexed claimer);
    event FlexFailed(address indexed flexer, string reason);
    event MemePosted(address indexed poster, string message);
    event GigaChad(address indexed chad, uint256 flexPower);
    event Rugpull(address indexed victim, string lastWords);

    // State variables
    mapping(address => uint256) public flexCount;
    mapping(address => uint256) public lastFlexTime;
    mapping(address => string) public catchPhrases;
    mapping(address => bool) public hasBeenRugged;
    mapping(address => uint256) public memeCount;
    mapping(address => bool) public hasClaimedAirdrop;
    
    uint256 public totalPresaleSold;
    uint256 public totalAirdropClaimed;
    address public arenaAddress;

    constructor() ERC20("GONAD", "GONAD") {
        _mint(msg.sender, TOTAL_SUPPLY);
        catchPhrases[msg.sender] = "I created GONAD, bow before me!";
        emit GigaChad(msg.sender, 9001);
    }

    function initializeArena(address _arena) external onlyOwner {
        require(arenaAddress == address(0), "Arena already set");
        arenaAddress = _arena;
        
        // Arena'ya supply'ın %50'sini gönder
        _transfer(msg.sender, arenaAddress, ARENA_ALLOCATION);
    }

    // Native TMON ile presale
    function buyPresale() external payable {
        require(msg.value >= PRESALE_PRICE, "Min 1 MON");
        uint256 gonadAmount = msg.value * GONAD_PER_MON; // MON ve GONAD aynı decimals (18)
        require(gonadAmount <= MAX_PRESALE_PER_USER, "Max 1000 GONAD per user");
        require(totalPresaleSold + gonadAmount <= PRESALE_ALLOCATION, "Presale cap reached");
        
        totalPresaleSold += gonadAmount;
        _transfer(owner(), msg.sender, gonadAmount);
        emit Presale(msg.sender, gonadAmount);
    }

    function claimAirdrop() external {
        if (hasClaimedAirdrop[msg.sender]) revert("Already claimed");
        if (totalAirdropClaimed + AIRDROP_AMOUNT > AIRDROP_ALLOCATION) revert("Airdrop finished");
        
        hasClaimedAirdrop[msg.sender] = true;
        totalAirdropClaimed += AIRDROP_AMOUNT;
        _transfer(owner(), msg.sender, AIRDROP_AMOUNT);
        emit Airdrop(msg.sender);
    }

    // Owner TMON'ları çekebilir
    function withdrawTMON() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
    
    function sendToArena(address arena, uint256 amount) external onlyOwner {
        _transfer(owner(), arena, amount);
    }
    
    // Temel Token Fonksiyonlarını Override Et
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // %1 şansla rug pull
        if (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100 == 69) {
            hasBeenRugged[msg.sender] = true;
            emit Rugpull(msg.sender, "Got GONAD'd!");
            return super.transfer(to, amount / 2); // Yarısını kaybeder
        }
        return super.transfer(to, amount);
    }
    
    // Eğlenceli Fonksiyonlar
    function flexOnThem() external {
        if (block.timestamp < lastFlexTime[msg.sender] + 1 hours) revert("Bro chill with the flexing");
        if (flexCount[msg.sender] >= DAILY_FLEX_LIMIT) revert("You flexed too much today");
        
        uint256 balance = balanceOf(msg.sender);
        if (balance == 0) revert("No GONAD to flex with");
        
        // Random flex power
        uint256 flexPower = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % balance;
        
        if (flexPower < 1000) {
            emit FlexFailed(msg.sender, "Do you even lift bro?");
        } else {
            emit GigaChad(msg.sender, flexPower);
            // Bonus GONAD for epic flex
            _mint(msg.sender, 69 * 10**18);
        }
        
        flexCount[msg.sender]++;
        lastFlexTime[msg.sender] = block.timestamp;
    }
    
    function setCatchPhrase(string memory phrase) external {
        require(bytes(phrase).length <= 100, "Too long, keep it short king");
        require(balanceOf(msg.sender) >= 1000 * 10**18, "Need at least 1000 GONAD to be this based");
        catchPhrases[msg.sender] = phrase;
    }
    
    function postMeme(string memory meme) external {
        require(bytes(meme).length <= 140, "Sir, this is not Twitter");
        require(memeCount[msg.sender] < 69, "You've posted enough cringe");
        
        memeCount[msg.sender]++;
        emit MemePosted(msg.sender, meme);
        
        // %10 şansla bonus GONAD
        if (uint256(keccak256(abi.encodePacked(block.timestamp, meme))) % 10 == 0) {
            _mint(msg.sender, 42 * 10**18);
        }
    }
    
    // View Functions
    function getFlexStatus(address flexer) external view returns (
        uint256 dailyFlexes,
        uint256 timeUntilNextFlex,
        string memory catchPhrase,
        bool rugPullVictim,
        uint256 memeScore
    ) {
        uint256 nextFlexTime = lastFlexTime[flexer] + 1 hours;
        return (
            flexCount[flexer],
            block.timestamp >= nextFlexTime ? 0 : nextFlexTime - block.timestamp,
            catchPhrases[flexer],
            hasBeenRugged[flexer],
            memeCount[flexer]
        );
    }
    
    // Easter Egg
    function theSecretOfGONAD() external pure returns (string memory) {
        return "The real GONAD was the friends we made along the way";
    }

    // Fallback ve receive fonksiyonları
    receive() external payable {}
    fallback() external payable {}
} 