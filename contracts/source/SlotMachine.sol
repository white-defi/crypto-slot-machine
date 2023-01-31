// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";


/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}
contract SlotMachine is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event LogString(
        string message
    );
    event LogUint256(
        string desc,
        uint256 value
    );
    event LogUint256Array(
        string desc,
        uint256[] value
    );
    event LogSlots(
        string desc,
        uint256[5][3] value
    );
    event LogLine(
        string desc,
        uint256[5] value
    );
    using Counters for Counters.Counter;
    Counters.Counter private _spinId;
    // Кол-во барабанов
    uint32 private _reelsCount = 5;

    mapping(address => uint256) private _userBalance;

    IERC20 public currency;
    uint256 public tokenPrice = 1;

    uint256 private constant _freeSlot = 2;
    uint256 private constant _wildSlot = 1;
    uint256 private constant _scatterSlot = 7;
    
    function getWildSlot() public view returns (uint256) {
        return _wildSlot;
    }
    function setWildSlot(uint256 _newWildSlot) public onlyOwner {
        _wildSlot = _newWildSlot;
    }

    uint256 private _maxBet = 100;
    uint256 private _maxLines = 19;

    function getMaxBet() public view returns (uint256) {
        return _maxBet;
    }
    function setMaxBet(uint256 newMaxBet) public onlyOwner {
        _maxBet = newMaxBet;
    }

    function getMaxLines() public view returns (uint256) {
        return _maxLines;
    }
    function setMaxLines(uint256 newMaxLines) public onlyOwner {
        _maxLines = newMaxLines;
    }
    uint256[5][] private winLines = [
        [1, 1, 1, 1, 1],    // 0
        [0, 0, 0, 0, 0],    // 1
        [2, 2, 2, 2, 2],    // 2

        [1, 1, 0, 1, 2],    // 3
        [1, 1, 2, 1, 0],    // 4
        [1, 0, 1, 2, 1],    // 5
        [1, 0, 1, 2, 2],    // 6
        [1, 0, 0, 1, 2],    // 7
        [1, 2, 1, 0, 1],    // 8
        [1, 2, 2, 1, 0],    // 9
        [1, 2, 1, 0, 0],    // 10

        [0, 1, 2, 1, 0],    // 11
        [0, 1, 1, 1, 2],    // 12
        [0, 0, 1, 2, 2],    // 13
        [0, 0, 1, 2, 1],    // 14
        [0, 0, 0, 1, 2],    // 15

        [2, 1, 0, 1, 2],    // 16
        [2, 1, 1, 1, 0],    // 17
        [2, 2, 1, 0, 0],    // 18
        [2, 2, 1, 0, 1]     // 19
    ];

    function setWinLines(uint256[5][] memory _winLines) public onlyOwner {
        winLines = _winLines;
    }
    function getWinLines() public view returns(uint256[5][] memory) {
        return winLines;
    }

    struct Spin {
        uint256     spinId;
        address     player;     // Игрок
        uint256     bet;        // Ставка
        uint256     utx;        // Время
        uint256     lines;      // Кол-во линий
        uint256[5]  slots;      // Выпавшие слоты
        uint256     winAmount;  // Выигрыш
    }
    mapping(address => Spin[]) public playerSpins;

    uint256[5][9] private slotMult = [
        /* 0 apple  */ [ uint256(0), uint256(0), uint256(20),   uint256(80),    uint256(200)],
        /* 1 bar    */ [ uint256(0), uint256(0), uint256(40),   uint256(400),   uint256(2000)],
        /* 2 bell   */ [ uint256(0), uint256(8), uint256(15),   uint256(120),   uint256(500)],
        /* 3 cherry */ [ uint256(0), uint256(2), uint256(8),    uint256(20),    uint256(80)],
        /* 4 lemon  */ [ uint256(0), uint256(0), uint256(8),    uint256(20),    uint256(80)],
        /* 5 orange */ [ uint256(0), uint256(0), uint256(20),   uint256(80),    uint256(200)],
        /* 6 plum   */ [ uint256(0), uint256(0), uint256(8),    uint256(20),    uint256(80)],
        /* 7 seven  */ [ uint256(0), uint256(0), uint256(20),   uint256(200),   uint256(1000)],
        /* 8 wmelon */ [ uint256(0), uint256(0), uint256(2),    uint256(5),     uint256(15)]
    ];

    function getMultiplers() public view returns(uint256[5][9] memory) {
        return slotMult;
    }
    function setMultiplers(uint256[5][9] memory _slotMult) public onlyOwner {
        slotMult = _slotMult;
    }

    uint256[5] private _div1 = [100000, 10000, 1000, 100, 10];
    uint256[5] private _div2 = [10000, 1000, 100, 100, 1];

    constructor(
        address _currency,
        uint256 _tokenPrice
    ) {
        currency = IERC20(_currency);
        tokenPrice = _tokenPrice;
    }

    bytes32 private _prevSeed = 0x0000000000000000000000000000000000000000000000000000000000000000;
    bytes32 private _curRS    = 0x0000000000000000000000000000000000000000000000000000000000000000;
    bytes32 private _prevRS   = 0x0000000000000000000000000000000000000000000000000000000000000000;


    function flushRandom(bytes32 _flushSeed) public onlyOwner {
        uint256 randomness = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            _prevSeed,
            _prevRS,
            _curRS,
            _flushSeed,
            _spinId.current()
        )));
        _prevRS = _curRS;
        _curRS = bytes32(randomness);
    }

    function getRandomBase(bytes32 _seed) private returns (uint256) {
        uint256 randomness = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            _seed,
            _prevSeed,
            _curRS,
            _prevRS,
            blockhash(block.number),
            block.coinbase,
            block.difficulty,
            block.gaslimit,
            tx.gasprice,
            msg.sender,
            gasleft(),
            _spinId.current()
        )));

        _prevSeed = _seed;
        return randomness;
    }

    function getRandom(bytes32 _seed, uint256 maxValue) private returns (uint256){
        uint256 randomness = getRandomBase(_seed);
        uint256 rand = randomness % maxValue;
        return rand;
    }

    function getWinLine(uint32 lineIndex) private view returns(uint256[5] storage) {
        return winLines[lineIndex];
    }

    function checkLine(
        uint256 currentLine,
        uint256[5][3] memory _spinResult
    ) private view returns(
        uint256,    // Выигрышная линия
        uint256     // Выигрышная комбинация
    ) {
        uint256 matchCount = 0;

        uint256 startNotWildReel = 0;
        uint256 firstSlot;
        
        // Ищем первый не wild (bar) слот
        for (uint256 reelIndex = 0; reelIndex < 5; reelIndex++) {
            if (_spinResult[winLines[currentLine][reelIndex]][reelIndex] != _wildSlot) {
                startNotWildReel = reelIndex;
                
                break;
            } else {
                matchCount++;
            }
        }
        
        if (matchCount > 0 && slotMult[_wildSlot][matchCount - 1] > 0) {
            // bars - wild check
            uint256 currentLineWin = slotMult[_wildSlot][
                matchCount - 1
            ];
            return (currentLineWin, _wildSlot);
        } else {
            firstSlot = _spinResult[winLines[currentLine][startNotWildReel]][startNotWildReel];
            for (uint256 reelIndex = startNotWildReel + 1; reelIndex < 5; reelIndex++) {
                if (
                    (_spinResult[winLines[currentLine][reelIndex]][reelIndex] == firstSlot)
                    || 
                    (_spinResult[winLines[currentLine][reelIndex]][reelIndex] == _wildSlot)
                ) {
                    matchCount++;
                } else {
                    break;
                }
            }
            if (matchCount>0) {
                uint256 currentWinMult = slotMult[firstSlot][
                    matchCount
                ];

                return (currentWinMult, firstSlot);
            }
        }
        return (0, 0);
    }

    function getAllowance(address erc20) view private returns(uint256) {
        IERC20 token = IERC20(erc20);
        uint256 allowance = token.allowance(msg.sender,address(this));
        return allowance;
    }

    function buyTokens(uint256 tokenAmount) public {
        uint256 ercAmount = tokenAmount * tokenPrice;
        uint256 buyerBalance = currency.balanceOf(msg.sender);
        require(buyerBalance >= ercAmount, "You do not have enough tokens on your balance to pay");
        uint256 buyerAllowance = currency.allowance(msg.sender, address(this));
        require(buyerAllowance >= ercAmount, "You did not allow the contract to send the purchase amount");
        
        currency.safeTransferFrom(
            address(msg.sender),
            address(this),
            ercAmount
        );
        _userBalance[msg.sender] += tokenAmount;
    }

    function getBankInTokens() public view returns (uint256) {
        uint256 ercBank = currency.balanceOf(address(this));
        uint256 tokenBank = SafeMath.div(ercBank, tokenPrice);
        return tokenBank;
    }

    function withdrawTokens() public {
        require(_userBalance[msg.sender] > 0, "Not enouth tokens for withdraw");
        uint256 ercAmount = _userBalance[msg.sender] * tokenPrice;
        
        uint256 bankAmount = currency.balanceOf(address(this));
        
        require(bankAmount > ercAmount, "Not enouth tokens in bank");

        currency.transfer(msg.sender, ercAmount);
        _userBalance[msg.sender] = 0;
    }

    function getCurrency() public view returns (address) {
        return address(currency);
    }
    function setCurrency(address newCurrency) public onlyOwner {
        currency = IERC20(newCurrency);
    }
    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }
    function setTokenPrice(uint256 newTokenPrice) public onlyOwner {
        tokenPrice = newTokenPrice;
    }
    function addUserBalance(uint256 bets) public {
        _userBalance[msg.sender] += bets;
    }

    function getUserBalance(address user) public view returns (uint256) {
        return _userBalance[user];
    }
    function getMyBalance() public view returns (uint256) {
        return _userBalance[msg.sender];
    }

    function spinReels(bytes32 _seed) private returns (uint256[5][3] memory) {
        uint256 randomness = getRandomBase(_seed);

        uint32 spinNumber = uint32(100000 + (randomness % 100000));

        uint256 reelIndex = 0;
        uint256 reelNumber = 0;

        uint256[5][3] memory _spinResult = [
            uint256[5]([uint256(0), uint256(0), uint256(0), uint256(0), uint256(0)]),
            uint256[5]([
                (spinNumber % _div1[0] / _div2[0]),
                (spinNumber % _div1[1] / _div2[1]),
                (spinNumber % _div1[2] / _div2[2]),
                (spinNumber % _div1[3] / _div2[3]),
                (spinNumber % _div1[4] / _div2[4])
            ]),
            uint256[5]([uint256(0), uint256(0), uint256(0), uint256(0), uint256(0)])
        ];
        

        for (reelIndex = 0; reelIndex < _reelsCount; reelIndex++) {
            reelNumber = _spinResult[1][reelIndex];
            if (reelNumber == 9) reelNumber = 0;
            _spinResult[1][reelIndex] = reelNumber;
            _spinResult[0][reelIndex] = (reelNumber == 0) ? 8 : (reelNumber - 1);
            _spinResult[2][reelIndex] = (reelNumber == 8) ? 0 : (reelNumber + 1);
        }
        return _spinResult;
    }

    event ReelsSpinned(
        address user,
        uint256 bet,
        uint256 lines,
        uint256 winAmount,
        uint256[5] slots,
        uint256[20] spinWinLines,
        uint256[20] spinWinSlots,
        uint256 maxLine,
        uint256 maxLineWin,
        uint256 maxWinSlot
    );
    
    function doSpin(uint256 bet, uint256 lineCount, bytes32 _seed) public /* returns(uint256[5] memory, uint256, bool[] memory) */ {
        uint256 betAmount = bet * (lineCount+1);
        require(_userBalance[msg.sender] >= betAmount, "Balance not enought");
        require(lineCount < winLines.length, "Too many lines");
        
        _spinId.increment();
        uint256 currentSpinId = _spinId.current();

        //bytes32 _seed = 0x0000000000000000000000000000000000000000000000000000000000000000;
        
        uint256[5][3] memory _spinResult = spinReels(_seed);
        
        /*
        uint256[5][3] memory _spinResult = [
            [uint256(8), uint256(8), uint256(8), uint256(8), uint256(8)],
            [uint256(0), uint256(0), uint256(0), uint256(0), uint256(0)],
            [uint256(1), uint256(1), uint256(1), uint256(1), uint256(1)]
        ];
        */
        


        uint256 maxLine = 0;
        uint256 maxLineWin = 0;
        uint256 maxWinSlot = 0;
        uint256[20] memory spinWinLines;
        uint256[20] memory spinWinSlots;
        uint256 totalWin = 0;

        for (uint256 currentLine = 0; currentLine < lineCount; currentLine++) {
            (uint256 currentLineWin, uint256 winSlot) = checkLine(currentLine, _spinResult);
            currentLineWin = currentLineWin * bet;
            totalWin = totalWin + currentLineWin;
            spinWinLines[currentLine] = currentLineWin;
            spinWinSlots[currentLine] = winSlot;
            if (currentLineWin > maxLineWin) {
                maxLine = currentLine;
                maxLineWin = currentLineWin;
                maxWinSlot = winSlot;
            }
        }
        _userBalance[msg.sender] = _userBalance[msg.sender] - betAmount + totalWin;
        
        playerSpins[msg.sender].push(
            Spin({
                spinId:     currentSpinId,
                player:     msg.sender,
                bet:        bet,
                utx:        block.timestamp,
                lines:      lineCount,
                slots:      _spinResult[1],
                winAmount:  totalWin
            })
        );

        emit ReelsSpinned(
            msg.sender,
            bet,
            lineCount+1,
            totalWin,
            _spinResult[1],
            spinWinLines,
            spinWinSlots,
            maxLine,
            maxLineWin,
            maxWinSlot
        );

    }
}