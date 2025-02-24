// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Gonad is ERC20, Ownable {
    // Komik Sabitler
    uint256 public constant TOTAL_SUPPLY = 69_420_000 * 10**18; // 69.42M GONAD
    uint256 public constant DAILY_FLEX_LIMIT = 42;
    string public constant MOTTO = "Get GONAD or Get Rekt!";
    
    // Komik State Variables
    mapping(address => uint256) public flexCount;
    mapping(address => uint256) public lastFlexTime;
    mapping(address => string) public catchPhrases;
    mapping(address => bool) public hasBeenRugged;
    mapping(address => uint256) public memeCount;
    
    // Komik Events
    event FlexFailed(address indexed flexer, string reason);
    event MemePosted(address indexed poster, string message);
    event GigaChad(address indexed chad, uint256 flexPower);
    event Rugpull(address indexed victim, string lastWords);
    
    constructor() ERC20("GONAD", "GONAD") {
        _mint(msg.sender, TOTAL_SUPPLY);
        catchPhrases[msg.sender] = "I created GONAD, bow before me!";
        emit GigaChad(msg.sender, 9001); // It's over 9000!
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
        require(block.timestamp >= lastFlexTime[msg.sender] + 1 hours, "Bro chill with the flexing");
        require(flexCount[msg.sender] < DAILY_FLEX_LIMIT, "You flexed too much today");
        
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "No GONAD to flex with");
        
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
} 