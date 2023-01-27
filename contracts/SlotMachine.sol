// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract SlotMachine is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _spinId;
    // Кол-во барабанов
    uint32 private _reelsCount = 5;
    mapping(uint32 => uint32) private _reelCalculator;

    struct Line {
        uint256[5] slot;
    }
    
    struct SpinResult {
        Line[3] line;
    }

    mapping(address => uint256[5]) private _userCurrentSlots;
    mapping(address => uint256) private _userBalance;

    uint256 private constant _freeSlot = 2;
    uint256 private constant _wildSlot = 1;
    uint256 private constant _scatterSlot = 7;
    
    uint256[][] private winLines = [
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

    function getWinLines() public view returns(uint256[][] memory) {
        return winLines;
    }

    struct Spin {
        address     player;     // Игрок
        uint256     bet;        // Ставка
        uint256     utx;        // Время
        uint256     lines;      // Кол-во линий
        uint256[5]  slots;      // Выпавшие слоты
        uint256     winLine;    // Выигрышная линия
        uint256     winAmount;  // Выигрыш
        uint256     winSlot;    // Комбинация, которая выиграла
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

    uint256[5] private _div1 = [100000, 10000, 1000, 100, 10];
    uint256[5] private _div2 = [10000, 1000, 100, 100, 1];

    constructor(
    ) {
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

    function getWinLine(uint32 lineIndex) private view returns(uint256[] storage) {
        return winLines[lineIndex];
    }

    function getMySlots() public view returns(uint256[5] memory) {
        return _userCurrentSlots[msg.sender];
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
                uint256 currentLineWin = slotMult[firstSlot][
                    matchCount
                ];

                return (currentLineWin, firstSlot);
            }
        }
        return (0, 0);
    }
    
    function addUserBalance(uint256 bets) public {
        _userBalance[msg.sender] += bets;
    }

    function getUserBalance() public view returns (uint256) {
        return _userBalance[msg.sender];
    }

    event Spinned(address user, uint256 bet, uint256 lines, uint256[5] slots, uint256 maxLine, uint256 maxLineWin, uint256 maxWinSlot);
    function doSpin(uint256 bet, uint256 lineCount /*bytes32 _seed*/) public /* returns(uint256[5] memory, uint256, bool[] memory) */ {
        uint256 betAmount = bet * (lineCount+1);
        require(_userBalance[msg.sender] - betAmount >= 0, "Balance");
        require(lineCount < winLines.length, "Too many lines");
         
        bytes32 _seed = 0x0000000000000000000000000000000000000000000000000000000000000000;
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
        _userCurrentSlots[msg.sender] = _spinResult[1];

        uint256 maxLine = 0;
        uint256 maxLineWin = 0;
        uint256 maxWinSlot = 0;

        for (uint256 currentLine = 0; currentLine < lineCount; currentLine++) {
            (uint256 currentLineWin, uint256 winSlot) = checkLine(currentLine, _spinResult);
            currentLineWin = currentLineWin * bet;
            if (currentLineWin > maxLineWin) {
                maxLine = currentLine;
                maxLineWin = currentLineWin;
                maxWinSlot = winSlot;
            }
        }
        _userBalance[msg.sender] = _userBalance[msg.sender] - betAmount + maxLineWin;
        emit Spinned(msg.sender, betAmount, lineCount, _spinResult[1], maxLine, maxLineWin, maxWinSlot);

    }
}