import contractData from "../contracts/source/artifacts/SlotMachine.json"
import Web3 from 'web3'
import MulticallAbi from '../contracts/MulticallAbi.json'

import { MULTICALL_CONTRACTS } from './constants'
import { Interface as AbiInterface } from '@ethersproject/abi'


import { CHAIN_INFO } from "./constants"

import { callMulticall } from './callMulticall'


const fetchSlotsMachine = (options) => {
  const {
    activeWeb3, address, chainId
  } = options

  return new Promise((resolve, reject) => {
    const chainInfo = CHAIN_INFO(chainId)
    if (chainInfo && chainInfo.rpcUrls) {
      try {
        const contract = new activeWeb3.eth.Contract(contractData.abi, address)
        
        const multicall = new activeWeb3.eth.Contract(MulticallAbi, MULTICALL_CONTRACTS[chainId])
        const abiI = new AbiInterface(contractData.abi)
        callMulticall({
          multicall,
          target: address,
          encoder: abiI,
          calls: {
            tokenPrice:       { func: 'getTokenPrice' },
            tokenCurrency:    { func: 'getCurrency' },
            maxBet:           { func: 'getMaxBet' },
            maxLines:         { func: 'getMaxLines' },
            wildSlot:         { func: 'getWildSlot' },
            winCombinations:  { func: 'getMultiplers' }
          }
        }).then((mcAnswer) => {
          resolve(mcAnswer)
        }).catch((err) => {
          console.log('>>> Fail fetch all user slots info', err)
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    } else {
      reject(`NOT_SUPPORTED_CHAIN`)
    }
  })
}

export default fetchSlotsMachine