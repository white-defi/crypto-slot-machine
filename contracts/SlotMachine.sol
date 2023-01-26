// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

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
        uint32[5] slot;
    }
    
    struct SpinResult {
        Line[3] line;
    }

    uint32[5] private _div1 = [100000, 10000, 1000, 100, 10];
    uint32[5] private _div2 = [10000, 1000, 100, 100, 1];
        
    uint32[][] private winLines;

    function getWinLines() public view returns(uint32[][] memory) {
        return winLines;
    }

    struct Spin {
        address player;
        uint256 bit;
        uint256 utx;
        uint256 numbers;
        uint256 prize;
    }

    function checkWinLine(uint32 lineIndex, SpinResult memory result) public view returns(bool) {
        uint32 r0 = result.line[winLines[lineIndex][0]].slot[0];
        uint32 r1 = result.line[winLines[lineIndex][1]].slot[1];
        uint32 r2 = result.line[winLines[lineIndex][2]].slot[2];
        uint32 r3 = result.line[winLines[lineIndex][3]].slot[3];
        uint32 r4 = result.line[winLines[lineIndex][4]].slot[4];

        if (r0 == r1 && r1 == r2 && r2 == r3 && r3 == r4) {
            return true;
        }
        return false;
    }

    constructor(
    ) {
        winLines.push([1, 1, 1, 1, 1]);
        winLines.push([0, 0, 0, 0, 0]);
        winLines.push([2, 2, 2, 2, 2]);

        winLines.push([1, 1, 0, 1, 2]);
        winLines.push([1, 1, 2, 1, 0]);
        winLines.push([1, 0, 1, 2, 1]);
        winLines.push([1, 0, 1, 2, 2]);
        winLines.push([1, 0, 0, 1, 2]);
        winLines.push([1, 2, 1, 0, 1]);
        winLines.push([1, 2, 2, 1, 0]);
        winLines.push([1, 2, 1, 0, 0]);

        winLines.push([0, 1, 2, 1, 0]);
        winLines.push([0, 1, 1, 1, 2]);
        winLines.push([0, 0, 1, 2, 2]);
        winLines.push([0, 0, 1, 2, 1]);
        winLines.push([0, 0, 0, 1, 2]);

        winLines.push([2, 1, 0, 1, 2]);
        winLines.push([2, 1, 1, 1, 0]);
        winLines.push([2, 2, 1, 0, 0]);
        winLines.push([2, 2, 1, 0, 1]);
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

    function getWinLine(uint32 lineIndex) private view returns(uint32[] storage) {
        return winLines[lineIndex];
    }

    function doSpin(/*bytes32 _seed*/) public returns(uint32) {
        bytes32 _seed = 0x0000000000000000000000000000000000000000000000000000000000000000;
        uint256 randomness = getRandomBase(_seed);
        console.log("rand", randomness);
        uint32 spinNumber = uint32(100000 + (randomness % 100000));

        
        Line memory __l1;
        Line memory __l0;
        Line memory __l2;
        
        
        for (uint32 reelIndex = 0; reelIndex < _reelsCount; reelIndex++) {
            uint32 reelNumber =  (spinNumber % _div1[reelIndex] / _div2[reelIndex]);
            if (reelNumber == 9) reelNumber = 0;
            
            __l1.slot[reelIndex] = reelNumber;
            __l0.slot[reelIndex] = (reelNumber == 0) ? 8 : (reelNumber - 1);
            __l2.slot[reelIndex] = (reelNumber == 8) ? 0 : (reelNumber + 1);
            
        }

        SpinResult memory _spinResult;
        _spinResult.line[1] = __l1;
        _spinResult.line[0] = __l0;
        _spinResult.line[2] = __l2;
        
        console.log("Spin number", spinNumber);
        console.log("Check win lines");

        uint32[] memory winnedLines;
        uint32 winnedLinesCounter = 0;
        for (uint32 winLine = 0; winLine < winLines.length; winLine++) {
            bool isWinLine = checkWinLine(winLine, _spinResult);
            if (isWinLine) {
                winnedLines[winnedLinesCounter] = winLine;
                winnedLinesCounter++;
                console.log("Win line:", winLine);
            }
        }

        return spinNumber;
    }
}