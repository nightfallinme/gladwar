// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/IGonad.sol";

contract GladiatorArena is Ownable {
    IERC20 public token;
    IGonad public gonad;
    
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
        uint256 underwearCount;
    }
    
    // Easter Egg ve Komik Mekanikler
    mapping(address => uint256) public crowdApplause;      // izleyici alkışları
    mapping(address => uint256) public throwenUnderwear;   // ringe atılan iç çamaşırı sayısı
    mapping(address => string) public lastWords;           // son sözler
    mapping(address => uint256) public flexCount;          // kas gösterme sayısı
    mapping(address => bool) public hasSlippedInArena;     // arenada düşüp düşmediği
    
    mapping(address => Gladiator) public gladiators;
    uint256 public constant TRAINING_COOLDOWN = 1 minutes;
    uint256 public constant FIGHT_COOLDOWN = 1 hours;
    uint256 public constant TRAINING_FEE = 1 ether;    // 1 GONAD
    uint256 public constant FIGHT_FEE = 5 ether;       // 5 GONAD
    
    // Ödül havuzu
    uint256 public rewardPool;
    
    // Ödül miktarları
    uint256 public constant NAKED_WIN_REWARD = 12 ether;  // 12 GONAD
    uint256 public constant NORMAL_WIN_REWARD = 10 ether; // 10 GONAD
    
    // Komik Eventler
    event GladiatorCreated(address indexed owner, string name, string battleCry);
    event Training(address indexed owner, uint256 strengthGain, uint256 staminaGain, bool fellWhileTraining);
    event Fight(address indexed challenger, address indexed opponent, address winner, string epicMoment);
    event CrowdGoesWild(address indexed gladiator, uint256 underwearCount);
    event EpicFlexFail(address indexed gladiator, string failDescription);
    event NakedBonus(address indexed gladiator, uint256 bonusAmount);
    
    // Max uint256 değeri
    uint256 private constant MAX_INT = type(uint256).max;
    
    constructor(address _token) {
        token = IERC20(_token);
        gonad = IGonad(_token);
    }
    
    function createGladiator(string memory _name, string memory _battleCry, string memory _pose) external {
        require(gladiators[msg.sender].strength == 0, "Already has gladiator");
        require(bytes(_battleCry).length > 0, "Need a battle cry, you coward!");
        
        string[] memory initialTitles = new string[](1);
        initialTitles[0] = "Noob of the Arena";
        
        gladiators[msg.sender] = Gladiator({
            name: _name,
            strength: 50,
            stamina: 50,
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
            hasCoolNickname: false,
            underwearCount: 0
        });
        
        emit GladiatorCreated(msg.sender, _name, _battleCry);
    }
    
    function train() external {
        _checkTrainingRequirements(msg.sender);
        
        _handleGonadTransfer(msg.sender, address(this), TRAINING_FEE);
        rewardPool += TRAINING_FEE;
        
        Gladiator storage glad = gladiators[msg.sender];
        require(glad.strength > 0, "No gladiator");
        require(block.timestamp >= glad.lastTraining + TRAINING_COOLDOWN, "Training cooldown");
        
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
        _checkFightRequirements(msg.sender, _opponent);
        
        // Fight ücreti al
        _handleGonadTransfer(msg.sender, address(this), FIGHT_FEE);
        rewardPool += FIGHT_FEE;
        
        Gladiator storage glad1 = gladiators[msg.sender];
        Gladiator storage glad2 = gladiators[_opponent];
        
        require(glad1.strength > 0 && glad2.strength > 0, "Invalid gladiators");
        require(block.timestamp >= glad1.lastFight + FIGHT_COOLDOWN, "Fight cooldown");
        
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
            
            uint256 reward = glad1.isNaked ? NAKED_WIN_REWARD : NORMAL_WIN_REWARD;
            require(rewardPool >= reward, "Insufficient reward pool");
            
            token.transfer(msg.sender, reward);
            rewardPool -= reward;
            
            epicMoment = string(abi.encodePacked(
                glad1.name,
                " destroyed ",
                glad2.name,
                " while screaming '",
                _taunt,
                "'"
            ));
            
            // Fan kazanma şansını artır (%50)
            if (random % 100 < 50) {
                glad1.fanCount++;
                // %20 şansla underwear fırlat
                if (random % 100 < 20) {
                    glad1.underwearCount++;
                    emit CrowdGoesWild(msg.sender, glad1.underwearCount);
                }
            }
        } else {
            glad2.wins++;
            glad1.losses++;
            winner = _opponent;
            token.transfer(_opponent, 10 ether);
            epicMoment = "Lost after slipping on their own sweat!";
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
            glad.underwearCount
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

    // Max approve fonksiyonu
    function maxApprove() external {
        require(token.approve(address(this), type(uint256).max), "Max approve failed");
    }

    // Allowance kontrolü için helper fonksiyonlar
    function checkAllowance(address user) public view returns (uint256) {
        return token.allowance(user, address(this));
    }

    function checkUserLimits(address user) external view returns (
        uint256 allowance,
        uint256 balance,
        uint256 fightCost,
        uint256 trainingCost
    ) {
        return (
            token.allowance(user, address(this)),
            token.balanceOf(user),
            FIGHT_FEE,
            TRAINING_FEE
        );
    }

    // Helper functions
    function _handleGonadTransfer(address from, address to, uint256 amount) internal {
        // Önce allowance kontrol et
        uint256 allowance = token.allowance(from, address(this));
        require(allowance >= amount, "Insufficient allowance. Call maxApprove() first");
        
        // Sonra balance kontrol et
        uint256 balance = token.balanceOf(from);
        require(balance >= amount, "Insufficient balance");
        
        // Transfer yap
        require(token.transferFrom(from, to, amount), "Transfer failed");
    }

    // Fight öncesi kontroller
    function _checkFightRequirements(address fighter, address opponent) internal view {
        require(gladiators[fighter].strength > 0, "Create a gladiator first");
        require(gladiators[opponent].strength > 0, "Opponent doesn't exist");
        require(block.timestamp >= gladiators[fighter].lastFight + FIGHT_COOLDOWN, "Fight cooldown");
        
        // Allowance ve balance kontrol
        uint256 allowance = token.allowance(fighter, address(this));
        require(allowance >= FIGHT_FEE, "Insufficient fight allowance");
        
        uint256 balance = token.balanceOf(fighter);
        require(balance >= FIGHT_FEE, "Insufficient GONAD for fight");
    }

    // Training öncesi kontroller  
    function _checkTrainingRequirements(address trainee) internal view {
        require(gladiators[trainee].strength > 0, "Create a gladiator first");
        require(block.timestamp >= gladiators[trainee].lastTraining + TRAINING_COOLDOWN, "Training cooldown");
        
        // Allowance ve balance kontrol
        uint256 allowance = token.allowance(trainee, address(this));
        require(allowance >= TRAINING_FEE, "Insufficient training allowance");
        
        uint256 balance = token.balanceOf(trainee);
        require(balance >= TRAINING_FEE, "Insufficient GONAD for training");
    }

    // Ödül havuzunu doldur
    function addToRewardPool(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        rewardPool += amount;
    }
} 