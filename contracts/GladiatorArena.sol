// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Gonad.sol";  // Bu import'un çalışması için Gonad.sol aynı klasörde olmalı

contract GladiatorArena is Ownable {
    Gonad public gonad; // IERC20 yerine Gonad kullanalım
    
    struct Gladiator {
        string name;
        uint256 strength;     // 1-100 arası
        uint256 stamina;      // 1-100 arası
        uint256 wins;
        uint256 losses;
        uint256 lastTraining; // son antrenman zamanı
        uint256 lastFight;    // son dövüş zamanı
        string battleCry;     // savaş narası
        string favoritePose;  // favori poz
        uint256 tauntsUsed;   // rakiple dalga geçme sayısı
        bool isNaked;         // çıplak dövüşüyor mu? (bonus alır)
        string[] titles;      // kazanılan ünvanlar
        uint256 fanCount;     // hayran sayısı
        bool hasCoolNickname; // havalı lakabı var mı?
    }
    
    // Easter Egg ve Komik Mekanikler
    mapping(address => uint256) public crowdApplause;      // izleyici alkışları
    mapping(address => uint256) public throwenUnderwear;   // ringe atılan iç çamaşırı sayısı
    mapping(address => string) public lastWords;           // son sözler
    mapping(address => uint256) public flexCount;          // kas gösterme sayısı
    mapping(address => bool) public hasSlippedInArena;     // arenada düşüp düşmediği
    
    mapping(address => Gladiator) public gladiators;
    uint256 public constant TRAINING_COOLDOWN = 1 minutes;
    uint256 public constant FIGHT_COOLDOWN = 2 minutes;
    uint256 public constant TRAINING_FEE = 1 ether;    // 1 GONAD
    uint256 public constant FIGHT_FEE = 5 ether;       // 5 GONAD
    
    // Komik Eventler
    event GladiatorCreated(address indexed owner, string name, string battleCry);
    event Training(address indexed owner, uint256 strengthGain, uint256 staminaGain, bool fellWhileTraining);
    event Fight(address indexed challenger, address indexed opponent, address winner, string epicMoment);
    event CrowdGoesWild(address indexed gladiator, uint256 underwearCount);
    event EpicFlexFail(address indexed gladiator, string failDescription);
    event NakedBonus(address indexed gladiator, uint256 bonusAmount);
    
    constructor(Gonad _gonad) {
        gonad = _gonad;
    }
    
    function createGladiator(string memory _name, string memory _battleCry, string memory _pose) external {
        require(gladiators[msg.sender].strength == 0, "Already has gladiator");
        require(bytes(_battleCry).length > 0, "Need a battle cry, you coward!");
        
        string[] memory initialTitles = new string[](1);
        initialTitles[0] = "Noob of the Arena";
        
        gladiators[msg.sender] = Gladiator({
            name: _name,
            strength: 10,
            stamina: 10,
            wins: 0,
            losses: 0,
            lastTraining: 0,
            lastFight: 0,
            battleCry: _battleCry,
            favoritePose: _pose,
            tauntsUsed: 0,
            isNaked: false,
            titles: initialTitles,
            fanCount: 1, // Annen her zaman fanındır
            hasCoolNickname: false
        });
        
        emit GladiatorCreated(msg.sender, _name, _battleCry);
    }
    
    function train() external {
        Gladiator storage glad = gladiators[msg.sender];
        require(glad.strength > 0, "No gladiator");
        require(block.timestamp >= glad.lastTraining + TRAINING_COOLDOWN, "Training cooldown");
        require(gonad.transferFrom(msg.sender, address(this), TRAINING_FEE), "Fee transfer failed");
        
        // Flex yap
        try gonad.flexOnThem() {
            // Başarılı flex bonus verir
            glad.strength += 2;
        } catch {
            // Başarısız flex ceza verir
            if (glad.strength > 2) glad.strength -= 2;
        }
        
        // %20 şansla antrenmanda düşer
        bool fellDown = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 5 == 0;
        
        // Random güç ve dayanıklılık artışı (1-5 arası)
        uint256 strengthGain = (block.timestamp % 5) + 1;
        uint256 staminaGain = (block.number % 5) + 1;
        
        if (fellDown) {
            // Düştüğü için bonus alır (sempati puanı)
            strengthGain += 2;
            staminaGain += 2;
            hasSlippedInArena[msg.sender] = true;
            emit EpicFlexFail(msg.sender, "Slipped on a banana while doing push-ups");
        }
        
        glad.strength = min(glad.strength + strengthGain, 100);
        glad.stamina = min(glad.stamina + staminaGain, 100);
        glad.lastTraining = block.timestamp;
        
        // Kas gösterme sayısını artır
        flexCount[msg.sender]++;
        
        emit Training(msg.sender, strengthGain, staminaGain, fellDown);
    }
    
    function fight(address _opponent, string memory _taunt) external {
        Gladiator storage glad1 = gladiators[msg.sender];
        Gladiator storage glad2 = gladiators[_opponent];
        
        require(glad1.strength > 0 && glad2.strength > 0, "Invalid gladiators");
        require(block.timestamp >= glad1.lastFight + FIGHT_COOLDOWN, "Fight cooldown");
        require(gonad.transferFrom(msg.sender, address(this), FIGHT_FEE), "Fee transfer failed");
        
        // Taunt bonus
        glad1.tauntsUsed++;
        uint256 tauntBonus = bytes(_taunt).length; // Uzun tauntlar daha fazla bonus verir
        
        // Çıplak dövüş bonusu
        uint256 nakedBonus = glad1.isNaked ? 20 : 0;
        if (glad1.isNaked) {
            emit NakedBonus(msg.sender, nakedBonus);
            throwenUnderwear[msg.sender]++; // Birileri ringe iç çamaşırı atar
        }
        
        // Dövüş sonucunu hesapla
        uint256 power1 = (glad1.strength * glad1.stamina) + tauntBonus + nakedBonus;
        uint256 power2 = (glad2.strength * glad2.stamina);
        
        // Random faktör
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _opponent)));
        power1 += random % 50;
        power2 += (random >> 128) % 50;
        
        string memory epicMoment;
        address winner;
        
        if (power1 > power2) {
            glad1.wins++;
            glad2.losses++;
            winner = msg.sender;
            glad1.fanCount += 2;
            epicMoment = "Won with a spectacular flying kick!";
            
            // Kazanan çıplaksa extra GONAD
            if (glad1.isNaked) {
                gonad.transfer(msg.sender, 12 ether); // 12 GONAD
            } else {
                gonad.transfer(msg.sender, 10 ether); // 10 GONAD
            }
        } else {
            glad2.wins++;
            glad1.losses++;
            winner = _opponent;
            glad2.fanCount += 1;
            epicMoment = "Lost after slipping on their own sweat!";
            gonad.transfer(_opponent, 10 ether);
        }
        
        // Kalabalık çıldırır
        if (random % 10 == 0) {
            crowdApplause[winner] += 100;
            throwenUnderwear[winner] += 3;
            emit CrowdGoesWild(winner, 3);
        }
        
        glad1.lastFight = block.timestamp;
        emit Fight(msg.sender, _opponent, winner, epicMoment);
        
        // Kazanan catch phrase'ini günceller
        try gonad.setCatchPhrase(string(abi.encodePacked("I just rekt ", glad2.name))) {} catch {}
        
        // Kazanan meme post eder
        try gonad.postMeme(_taunt) {} catch {}
    }
    
    // Easter Egg Fonksiyonları
    function toggleNakedMode() external {
        Gladiator storage glad = gladiators[msg.sender];
        require(glad.strength > 0, "No gladiator");
        glad.isNaked = !glad.isNaked;
        
        if (glad.isNaked) {
            throwenUnderwear[msg.sender] += 5;
            emit CrowdGoesWild(msg.sender, 5);
        }
    }
    
    function setLastWords(string memory _words) external {
        require(bytes(_words).length <= 100, "Last words too long");
        lastWords[msg.sender] = _words;
    }
    
    function addCoolNickname(string memory _nickname) external {
        Gladiator storage glad = gladiators[msg.sender];
        require(glad.strength > 0, "No gladiator");
        require(!glad.hasCoolNickname, "Already has cool nickname");
        
        glad.name = string(abi.encodePacked(_nickname, " ", glad.name));
        glad.hasCoolNickname = true;
        glad.fanCount += 10;
    }
    
    // View Fonksiyonları
    function getGladiatorBasicStats(address _owner) external view returns (
        string memory name,
        uint256 strength,
        uint256 stamina,
        uint256 wins,
        uint256 losses
    ) {
        Gladiator memory glad = gladiators[_owner];
        return (
            glad.name,
            glad.strength,
            glad.stamina,
            glad.wins,
            glad.losses
        );
    }

    function getGladiatorExtraStats(address _owner) external view returns (
        string memory battleCry,
        string memory favoritePose,
        uint256 fanCount,
        bool isNaked,
        uint256 underwearCount
    ) {
        Gladiator memory glad = gladiators[_owner];
        return (
            glad.battleCry,
            glad.favoritePose,
            glad.fanCount,
            glad.isNaked,
            throwenUnderwear[_owner]
        );
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // Yeni fonksiyonlar ekleyelim
    function checkFlexStatus(address _gladiator) external view returns (
        uint256 dailyFlexes,
        uint256 timeUntilNextFlex,
        string memory catchPhrase,
        bool rugPullVictim,
        uint256 memeScore
    ) {
        return gonad.getFlexStatus(_gladiator);
    }

    function getGladiatorMotto() external pure returns (string memory) {
        return "GONAD makes you stronger!";
    }

    // Özel event
    event GladiatorGotRugged(address indexed gladiator, uint256 gonadLost);

    // Override transfer to check for rugs
    function _handleGonadTransfer(address _from, address _to, uint256 _amount) internal {
        uint256 balanceBefore = gonad.balanceOf(_to);
        require(gonad.transferFrom(_from, _to, _amount), "Transfer failed");
        uint256 balanceAfter = gonad.balanceOf(_to);

        // Eğer rug pull olduysa
        if (balanceAfter - balanceBefore < _amount) {
            emit GladiatorGotRugged(_from, _amount - (balanceAfter - balanceBefore));
            
            // Rugged gladyatöre sempati bonusu
            Gladiator storage glad = gladiators[_from];
            glad.fanCount += 10;
            glad.titles.push("The Rugged One");
        }
    }
} 