import TokenAbi from 'human-standard-token-abi'
import Web3 from 'web3'

import { CHAIN_INFO } from "../helpers/constants"

const getTokenAllowance = (options) => {
  const {
    tokenAddress,
    chainId,
    owner,
    spender,
  } = options
  return new Promise((resolve, reject) => {
    const chainInfo = CHAIN_INFO(chainId)
    if (chainInfo) {
      try {
        const web3 = new Web3(chainInfo.rpcUrls[0])

        const contract = new web3.eth.Contract(TokenAbi, tokenAddress)
        contract.methods.allowance(owner,spender).call().then((amount) => {
          console.log('>>> allowance', amount)
          resolve(amount)
        }).catch((err) => {
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

export default getTokenAllowance
