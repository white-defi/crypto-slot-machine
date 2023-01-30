import { useEffect, useState } from "react"
import styles from "../styles/Home.module.css"
import { CHAIN_INFO, ZERO_ADDRESS } from "../helpers/constants"
import { toWei, fromWei } from "../helpers/wei"
import approveToken from "../helpers/approveToken"
import callSlotsMethod from "../helpers/callSlotsMethod"
import getTokenAllowance from "../helpers/getTokenAllowance"

import BigNumber from "bignumber.js"

export default function BuyTokensModal(options) {
  const {
    activeWeb3,
    activeWallet,
    openConfirmWindow,
    slotsContractAddress,
    addNotify,
    onClose,
    onBuy,
    chainId,
    bankTokenInfo,
    tokenPriceWei,
  } = options

  const [ tokensAmount, setTokensAmount ] = useState(1)
  const [ calcedPrice, setCalcedPrice ] = useState(0)
  const [ isApproved, setIsApproved ] = useState(false)
  const [ isNeedApprove, setIsNeedApprove ] = useState(false)
  const [ allowanceAmount, setAllowanceAmount ] = useState(0)
  
  useEffect(() => {
    const price = new BigNumber(tokensAmount).multipliedBy(tokenPriceWei)
    setIsNeedApprove(price.isGreaterThan(allowanceAmount))
  }, [ allowanceAmount, tokensAmount ])
  
  useEffect(() => {
    if (chainId && bankTokenInfo?.address) {
      getTokenAllowance({
        chainId,
        tokenAddress: bankTokenInfo.address,
        owner: activeWallet,
        spender: slotsContractAddress,
      }).then((answer) => {
        console.log('>>> allowanceAmount', answer)
        setAllowanceAmount(answer)
      }).catch((err) => {
        console.log('>>> fail fetch allowanceAmount', err)
      })
    }
  }, [activeWallet, chainId, bankTokenInfo, slotsContractAddress])

  useEffect(() => {
    const price = new BigNumber(tokensAmount).multipliedBy(tokenPriceWei).toFixed()
    setCalcedPrice(fromWei( price, bankTokenInfo.decimals))
  }, [tokensAmount])
  
  const chainInfo = CHAIN_INFO(chainId)

  const doBuyAfterApprove = () => {
    callSlotsMethod({
      activeWeb3,
      contractAddress: slotsContractAddress,
      method: 'buyTokens',
      args: [
        tokensAmount
      ],
      onTrx: (txHash) => {
        addNotify(`Buy tokens TX ${txHash}`, `success`)
      },
      onSuccess: (receipt) => {
        console.log('>> onSuccess', receipt)
        addNotify(`Buy tokens transaction broadcasted`, `success`)
      },
      onError: (err) => {
        console.log('>> onError', err)
        addNotify(`Buy tokens fail. ${err.message ? err.message : ''}`, `error`)
      },
      onFinally: (answer) => {
        console.log('>> onFinally', answer)
        addNotify(`Tokens buyed.`, `success`)
        onBuy()
      }
    })
  }
  const doBuy = () => {
    console.log('>>> isNeedApprove', isNeedApprove)
    if (isNeedApprove) {
      const weiAmount = new BigNumber(tokensAmount).multipliedBy(tokenPriceWei).toFixed()
      approveToken({
        activeWeb3,
        chainId,
        tokenAddress: bankTokenInfo.address,
        approveFor: slotsContractAddress,
        weiAmount
      }).then((isOk) => {
        console.log('>>> is appoved', isOk)
        doBuyAfterApprove()
      }).catch((err) => {
        console.log('>>> fail approve')
      })
    } else {
      doBuyAfterApprove()
    }
  }


  return (
    <>
      <style jsx>
      {`
        .BuyTokensModal {
          
        }
        .BuyTokensModal>DIV {
          min-width: 700px;
        }
        .BuyTokensModal .form {
          display: flex;
          align-items: center;
        }
        .BuyTokensModal .form>DIV {
          width: 50%;
        }
        .BuyTokensModal .inputsHolder {
          text-align: left;
        }
        .BuyTokensModal .inputsHolder LABEL {
          display: block;
          font-weight: bold;
          font-size: 14pt;
        }
        .BuyTokensModal .inputsHolder SELECT,
        .BuyTokensModal .inputsHolder INPUT {
          display: block;
          width: 100%;
          font-size: 14pt;
          margin-bottom: 10px;
          line-height: 32px;
          height: 32px;
        }
        .BuyTokensModal .inputsHolder INPUT {
          margin-bottom: 0px;
        }
        .BuyTokensModal .inputsHolder .info LABEL {
          font-size: 10pt;
        }
        .BuyTokensModal .info STRONG {
          display: block;
          font-size: 10pt;
        }
        .BuyTokensModal .error {
          display: block;
          font-size: 10pt;
          color: #d90d0d;
        }
      `}
      </style>
      <div className={`${styles.confirmWindow} BuyTokensModal`}>
        <div>
          {bankTokenInfo && bankTokenInfo.address && (
            <>
              <h3>Add Tokens</h3>
              <div className="form">
                <div className="inputsHolder">
                  <div>
                    <label>Tokens amount:</label>
                    <input type="number" min="1" max="100" value={tokensAmount} onChange={(e) => { setTokensAmount(e.target.value) }} />
                  </div>
                  <div>
                    <label>
                      Price:
                      <strong>{calcedPrice}</strong>
                      <strong>{bankTokenInfo.symbol}</strong>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <button disabled={false} className={`${styles.mainButton} primaryButton`} onClick={doBuy}>
                  {!isNeedApprove ? (
                    `Buy Tokens`
                  ) : (
                    `Approve & Buy`
                  )}
                </button>
                <button disabled={false} className={`${styles.mainButton} primaryButton`} onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}