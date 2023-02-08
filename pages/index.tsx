import { BigNumber, ethers } from "ethers"
import type { NextPage } from "next"
import { useEffect, useState } from "react"
import styles from "../styles/Home.module.css"

import { setupWeb3, switchOrAddChain, doConnectWithMetamask, isMetamaskConnected } from "../helpers/setupWeb3"
import { calcSendArgWithFee } from "../helpers/calcSendArgWithFee"
import navBlock from "../components/navBlock"
import { getLink } from "../helpers"
import { useRouter } from "next/router"
import useStorage from "../storage"
import crypto from "crypto"
import { CHAIN_INFO } from "../helpers/constants"
import { toWei, fromWei } from "../helpers/wei"
import Script from 'next/script'
import slotsContractData from "../contracts/source/artifacts/SlotMachine.json"
import callSlotsMethod from "../helpers/callSlotsMethod"
import sha256 from 'js-sha256'
import BuyTokensModal from "../components/BuyTokensModal"
import fetchUserSlotsInfo from "../helpers/fetchUserSlotsInfo"
import fetchSlotsMachine from "../helpers/fetchSlotsMachine"


import DesignNumberInput from "../components/DesignNumberInput"

const debugLog = (msg) => { console.log(msg) }

const genSalt = () => {
  const result           = ''
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for ( var i = 0; i < 128; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const Slots: NextPage = (props) => {
  const {
    storageData,
    isOwner,
    addNotify,
    getText,
    getDesign,
    openConfirmWindow,
  } = props
  
  const [ chainId, setChainId ] = useState(storageData?.chainId)
  const [ slotsContractAddress, setSlotsContractAddress ] = useState(storageData?.slotsContractAddress)
  const [ bankTokenInfo, setBankTokenInfo ] = useState(storageData?.bankTokenInfo)
  const [ tokenPriceWei, setTokenPriceWei ] = useState(0)

  const [activeWeb3, setActiveWeb3] = useState(false)
  const [activeChainId, setActiveChainId] = useState(false)
  const [isWalletConecting, setIsWalletConnecting] = useState(false)
  const [address, setAddress] = useState(false)

  const [slotsContract, setSlotsContract] = useState(false)
  const [slotMachine, setSlotMachine] = useState(false) // Render engine
  
  const [ slotMultipler, setSlotMultipler ] = useState(false)

  const [ tokensBank, setTokensBank ] = useState(0)
  const [ tokensBankInERC, setTokensBankInERC ] = useState(0)
  const [ userTokens, setUserTokens ] = useState(0)
  const [ userTokensAdd, setUserTokensAdd ] = useState(0)
  const [ currentLineWin, setCurrentLineWin ] = useState(0)
  const [ currentSlots, setCurrentSlots ] = useState([0, 0, 0, 0, 0])
  const [ winAmountCounter, setWinAmountCounter ] = useState(0)
  const [ winLines, setWinLines ] = useState([])
  const [ winLinesAmount, setWinLinesAmount ] = useState([])
  const [ winLinesSwitchCounter, setWinLinesSwitchCounter ] = useState(0)
  
  const processError = (error, error_namespace) => {
    let metamaskError = false
    try {
      metamaskError = error.message.replace(`Internal JSON-RPC error.`,``)
      metamaskError = JSON.parse(metamaskError)
    } catch (e) {}
    const errMsg = (metamaskError && metamaskError.message) ? metamaskError.message : error.message
    
    switch (errMsg) {
      case `execution reverted: You don't own this token!`:
        console.log(`You dont own this token`)
        break;
      case `MetaMask Tx Signature: User denied transaction signature.`:
        console.log('Transaction denied')
        break;
      case `execution reverted: ERC721: invalid token ID`:
        console.log('Invalid token ID')
        break;
      default:
        console.log('Unkrnown error', error.message)
        break;
    }
  }

  const updateUserSlotsState = () => {
    fetchUserSlotsInfo({
      activeWeb3,
      activeWallet: address,
      address: slotsContractAddress,
      chainId,
    }).then((answer) => {
      setUserTokens(Number(answer.tokensAmount))
      setTokenPriceWei(answer.tokenPrice)
      setTokensBank(answer.tokensBank)
    }).catch((err) => {
      console.log('>>> err', err)
    })
  }

  const [betAmount, setBetAmount] = useState(1)
  const [lineCount, setLineCount] = useState(1)
  const [maxBet, setMaxBet] = useState(1)
  const [maxLines, setMaxLines] = useState(1)
  
  useEffect(() => {
    if (chainId && slotsContractAddress) {
      fetchSlotsMachine({
        chainId,
        address: slotsContractAddress
      }).then((answer) => {
        console.log('>>> Slot machine statlus', answer)
        setMaxBet(answer.maxBet)
        setMaxLines(answer.maxLines)
        prepareWinCombinations(answer.winCombinations)
      }).catch((err) => {
        console.log('Fail fetch slot machine status', err)
      })
    }
  }, [ chainId, slotsContractAddress ])

  useEffect(() => {
    if (activeWeb3 && address && chainId && slotsContractAddress) {
      updateUserSlotsState()
    }
  }, [activeWeb3, address, chainId, slotsContractAddress])
  
  const initOnWeb3Ready = async () => {
    if (activeWeb3 && (`${activeChainId}` == `${chainId}`)) {
      activeWeb3.eth.getAccounts().then((accounts) => {
        setAddress(accounts[0])
        const _contact = new activeWeb3.eth.Contract(slotsContractData.abi, slotsContractAddress)
        setSlotsContract(_contact)
        
        
      }).catch((err) => {
        console.log('>>> initOnWeb3Ready', err)
        processError(err)
      })
    } else {
      const _isConnected = await isMetamaskConnected()
      if (_isConnected) {
        connectWithMetamask()
      }
    }
  }

  
  
  useEffect(() => {
    if (storageData
      && storageData.chainId
    ) {
      setChainId(storageData.chainId)
    }
  }, [storageData])


  const prepareWinCombinations = (multiplers) => {
    const winCombination = multiplers.map((data, key) => {
      return {
        id: key,
        data: [...data].reverse()
      }
    }).sort((a,b) => {
      return a.data[0] > b.data[0] ? -1 : 1
    })
    console.log('>>> setSlotMultipler', winCombination)
    setSlotMultipler((prev) => {
      return winCombination
    })
  }
  /* INIT RENDER ENGINE */
  useEffect(() => {
    if (activeWeb3 && isMetamaskConnected) {
      const waitCanvas = setInterval(() => {
        const canvas = document.getElementById(`renderCanvas`)
        if (canvas && window.SLOT_MACHINE) {
          setSlotMachine(window.SLOT_MACHINE)
          console.log('>>> setSlot machine')
          window.SLOT_MACHINE.init({
            canvasId: 'renderCanvas',
            slotSize: 200,
          })
          //prepareWinCombinations(window.SLOT_MACHINE.getMultiplers())
          clearInterval(waitCanvas)
        }
      }, 100)
      return () => { clearInterval(waitCanvas) }
    }
  }, [activeWeb3, isMetamaskConnected])

  const lineColors = [
    '#9907077a',
    '#079985a3',
    '#990795a3',
    '#179907a3',
    '#418dff',
    '#a855f7',
    '#7d55f7ab',
    '#f5f755ab',
    '#f78955e0',
    '#55f7d9e0',
    '#9907077a',
    '#079985a3',
    '#990795a3',
    '#179907a3',
    '#418dff',
    '#a855f7',
    '#7d55f7ab',
    '#f5f755ab',
    '#f78955e0',
    '#55f7d9e0',
  ]


  const winLinesSwitchDeplay = 2;
  
  const [ spinResult, setSpinResult ] = useState({})

/*
  useEffect(() => {
    const timer = setInterval(() => {
      if (userTokensAdd > 0) {
        setUserTokens((prev) => {
          return prev+1
        })
        setUserTokensAdd((prev) => {
          return prev-1;
        })
      }
    }, 10)
    return () => { clearInterval(timer) }
  })
*/
  useEffect(() => {
  /*
    const timer = setTimeout(() => {
      if (slotMachine) {
        console.log('>>> win line timer')
        if (winLinesSwitchCounter > 0) {
          setWinLinesSwitchCounter((prev) => {
            return prev - 1
          })
        } else {
          if (winLines.length > 0) {
            setWinAmountCounter((prev) => {
              const amount = winLinesAmount.shift()
              setWinLines((prevLines) => {
                const line = prevLines.shift()
                slotMachine.setActiveWinLine(line, spinResult.slots)
                return prevLines
              })

              return amount
            })
            setWinLinesSwitchCounter(winLinesSwitchDeplay)
          } else {
            console.log('>>> do hide')
            setWinAmountCounter(0)
            slotMachine.hideActiveWinLine()
          }
        }
      }
    }, 1000)
    return () => { clearTimeout(timer) }
    */
    console.log(winLines)
  }, [ winLines ])
  
  const doTest = () => {
    
  }
  
  useEffect(() => {
    if (slotMachine && slotMachine.isInited() && spinResult && spinResult.spinWinLines) {
      const newWinLines = []
      const newWinLinesAmount = spinResult.spinWinLines.filter((amount, line) => {
        if (amount > 0) {
          newWinLines.push(line)
          return true
        }
      })
      if (newWinLines.length) {
        const amount = newWinLinesAmount.shift()
        const line = newWinLines.shift()
        setWinLinesAmount(newWinLinesAmount)
        setWinLines(newWinLines)
        slotMachine.setActiveWinLine(line, spinResult.slots)
        setWinLinesSwitchCounter(winLinesSwitchDeplay)
      }
    }
  }, [ spinResult ])

  const doSpin = () => {
    const calcedHash = sha256(`${genSalt()}`)
    callSlotsMethod({
      activeWeb3,
      contractAddress: slotsContractAddress,
      method: 'doSpin',
      args: [
        betAmount,
        lineCount,
        `0x${calcedHash}`
      ],
      onTrx: (txHash) => {
        console.log('>> onTrx', txHash)
        slotMachine.setPreviewWinLines(-1)
        slotMachine.spin()
        setUserTokens((prev) => {
          return prev - (betAmount * lineCount)
        })
        addNotify(`Spinning... TX ${txHash}`, `success`)
      },
      onSuccess: (receipt) => {
        
      },
      onError: (err) => {
        addNotify(`Fail do spin. ${err.message ? err.message : ''}`, `error`)
      },
      onFinally: (answer) => {
        console.log('>> onFinally', answer)
        const spinData = answer.events.ReelsSpinned.returnValues
        const {
          slots,
          spinWinLines
        } = spinData
        const slotUp = (v) => {
          return (v == 0) ? 8 : v - 1
        }
        const slotDw = (v) => {
          return (v == 8) ? 0 : v +1
        }
        const resultSlots = [
          [ slotUp(slots[0]), slotUp(slots[1]), slotUp(slots[2]), slotUp(slots[3]), slotUp(slots[4]) ],
          slots,
          [ slotDw(slots[0]), slotDw(slots[1]), slotDw(slots[2]), slotDw(slots[3]), slotDw(slots[4]) ]
        ]
        console.log(spinData)
        slotMachine.stop(resultSlots, () => {
          setUserTokens((prev) => {
            return prev + Number(spinData.winAmount)
          })
          setSpinResult(spinData)
        })
      }
    }).catch((err) => {
      addNotify(`Fail do spin. ${err.message ? err.message : ''}`, `error`)
    })
    
  }
  const doStop = () => {
    SLOT_MACHINE.stop([[1,1,1,1,1],[2,2,2,2,2],[3,3,3,3,3]], () => {
      console.log('>>> stoped')
    })
  }

  useEffect(() => {
    debugLog('on useEffect activeWeb3 initOnWeb3Ready')
    if (chainId) {
      initOnWeb3Ready()
    }
  }, [activeWeb3, chainId, slotsContractAddress])

  const symbols = [
    `_MYAPP/vendor/images/symbols/apple.png`,
    `_MYAPP/vendor/images/symbols/bar.png`,
    `_MYAPP/vendor/images/symbols/bell.png`,
    `_MYAPP/vendor/images/symbols/cherry.png`,
    `_MYAPP/vendor/images/symbols/lemon.png`,
    `_MYAPP/vendor/images/symbols/orange.png`,
    `_MYAPP/vendor/images/symbols/plum.png`,
    `_MYAPP/vendor/images/symbols/seven.png`,
    `_MYAPP/vendor/images/symbols/water-melon.png`,
  ]

  const [ isWinCombinationsOpened, setIsWinCombinationsOpened ] = useState(false)
  const doShowWinCombinations = () => {
    setIsWinCombinationsOpened(true)
  }
  const doHideWinCombinations = () => {
    setIsWinCombinationsOpened(false)
  }
  const renderSlotMultipler = () => {
    if (!isWinCombinationsOpened) return null
    let iKey = 0
    return (
      <>
        <style jsx>
          {`
            .winTableHolder {
              position: fixed;
              left: 0px;
              top: 0px;
              bottom: 0px;
              right: 0px;
              overflow: auto;
              z-index: 20000;
              background: #0000008c;
            }
            .winTable {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              max-width: 640px;
              width: auto;
              background: #012442d1;
              padding: 10px;
              border: 2px solid #FFF;
              margin: 0 auto;
            }
            .winTable>DIV {
              background: #13487e;
              padding: 10px;
              margin: 5px;
              border: 1px solid #FFF;
              box-shadow: 0px 0px 2px 2px rgb(0 0 0 / 75%);
            }
            .winTable IMG {
              display: block;
              width: 32px;
            }
            .winTable .winHolder STRONG {
              display: block;
              min-width: 100px;
              text-align: right;
            }
            .winTable .winHolder {
              display: flex;
              border-bottom: 1px solid #FFF;
              justify-content: space-between;
              align-items: center;
              flex-wrap: nowrap;
            }
            .winTable .symbolsHolder {
              display: flex;
            }
            .winTable H2 {
              display: block;
              width: 100%;
              margin: 10px;
              font-size: 14pt;
              text-shadow: 1px 1px 5px black, -1px -1px 5px black, 1px -1px 5px black, -1px 1px 5px black;
            }
            .winTable .closeHolder {
              width: 100%;
              display: block;
              padding-top: 10px;
            }
            .winTable .closeHolder BUTTON {
              border-radius: 5px;
              font-family: Arial;
              color: #fff;
              font-size: 20px;
              background: #031736;
              padding: 10px 20px 10px 20px;
              border: solid #fff 1px;
              text-decoration: none;
              box-shadow: 0px 0px 2px 2px #00000094;
              cursor: pointer;
            }
            .winTable .closeHolder BUTTON:hover {
              background: #011524;
              text-decoration: none;
            }
          `}
        </style>
        <div className="winTableHolder">
          <div className="winTable">
            <h2>Win Combinations</h2>
            {slotMultipler.map((mData, kk) => {
              const notZeroCount = mData.data.map((m) => { return (m>0) ? true : false }).filter((m) => m)
              iKey ++
              return (
                <div key={iKey}>
                  {notZeroCount.map((m, mK) => {
                    return (
                      <div key={mK} className="winHolder">
                        <div className="symbolsHolder">
                          {mData.data.map((amount, key) => {
                            if (mK > key) return null
                            return (
                              <img key={key} src={symbols[mData.id]} />
                            )
                          })}
                        </div>
                        <strong>{mData.data[mK]*betAmount}</strong>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <span className="closeHolder">
              <button onClick={doHideWinCombinations}>Close</button>
            </span>
          </div>
        </div>
      </>
    )
  }
  const connectWithMetamask = async () => {
    doConnectWithMetamask({
      onBeforeConnect: () => { setIsWalletConnecting(true) },
      onSetActiveChain: setActiveChainId,
      onConnected: (cId, web3) => {
        setActiveWeb3(web3)
        setIsWalletConnecting(false)
      },
      onError: (err) => {
        console.log(">>>> connectWithMetamask", err)
        processError(err)
        setIsWalletConnecting(false)
      },
      needChainId: chainId,
    })
  }


  useEffect(() => {
    console.log('>>> lineCount', lineCount, slotMachine, slotMachine ? slotMachine.isInited() : false)
    if (slotMachine && slotMachine.isInited()) {
      slotMachine.render_reel()
      console.log('>>> lineCount', lineCount)
      for (let line = 0; line < lineCount; line++ ) {
        console.log('>>> render win line', line)
        slotMachine.setPreviewWinLines(line + 1)
      }
    }
  }, [lineCount, slotMachine])

  const [ isBuyTokens, setIsBuyTokens ] = useState(false)
  const buyTokens = () => {
    setIsBuyTokens(true)
  }
  const withdrawTokens = () => {
  }
  const mintChainInfo = CHAIN_INFO(chainId)
  return (
    <div className={styles.container}>
      {navBlock(`slots`, isOwner)}
      <h1 className={`${styles.h1} pageTitle`}>
        {getText(`SlotsTitle`, `Crypto Slot Machine`)}
      </h1>
      
      {!address ? (
        <>
          <div className="textBeforeConnectWallet">
            {getText('Text_BeforeConnect_Text')}
          </div>
          <button disabled={isWalletConecting} className={`${styles.mainButton} primaryButton`} onClick={connectWithMetamask}>
            {isWalletConecting ? `Connecting` : `Connect Wallet`}
          </button>
          <div className="textAfterConnectWallet">
            {getText('Text_AfterConnect_Text')}
          </div>
        </>
      ) : (
        <div className="slotMachine">
          <style jsx>
          {`
            .slotMachine {
              width: 100%;
            }
            .slotMachine CANVAS {
              width: 100%;
              max-width: 640px;
              margin: 0 auto;
              border: 5px solid #02213a;
              box-shadow: 1px 1px 5px 5px #0000007a;
              border-radius: 10px;
            }
            .slotMachine .balanceHolder {
              display: flex;
              max-width: 640px;
              margin: 0 auto;
              justify-content: space-between;
              font-size: 11pt;
              padding-top: 5px;
              padding-bottom: 5px;
              border-bottom: 1px solid #FFF;
              margin-bottom: 10px;
              margin-top: 10px;
              border-top: 1px solid #FFF;
            }
            .slotMachine .balanceButtonsHolder {
              display: flex;
              max-width: 640px;
              margin: 0 auto;
              justify-content: space-between;
              font-size: 11pt;
            }
            .slotMachine .balanceButtonsHolder DIV {
              width: 40%;
            }
            .slotMachine .balanceButtonsHolder DIV BUTTON {
              width: 100%;
            }
            .slotMachine .buttonsHolder {
              display: flex;
              max-width: 640px;
              margin: 0 auto;
              justify-content: space-evenly;
              font-size: 11pt;
              padding-bottom: 10px;
            }
            .slotMachine .buttonsHolder .spinButton {
              margin-top: 10px;
            }
            @media screen and (max-width: 460px) {
              .slotMachine .buttonsHolder {
                flex-wrap: wrap;
              }
              .slotMachine .buttonsHolder .spinButton {
                order: 2;
                width: 100%;
              }
            }
            .slotMachine .buttonsHolder strong {
              font-size: 10pt;
              display: block;
            }
            .slotMachine .buttonsHolder INPUT {
              font-size: 10pt;
              font-weight: bold;
              text-align: center;
            }
          `}
          </style>
          <div className="bankAmount">
            {bankTokenInfo && bankTokenInfo.symbol && (
              <>
                Tokens in bank: {tokensBank} ({tokensBankInERC} {bankTokenInfo.symbol})
              </>
            )}
          </div>
          <div className="balanceButtonsHolder">
            <div>
              <button className={`${styles.mainButton} primaryButton`} onClick={buyTokens}>Add tokens</button>
            </div>
            <div>
              <button className={`${styles.mainButton} primaryButton`} onClick={withdrawTokens}>Withdraw</button>
            </div>
          </div>
          <div className="balanceHolder">
            <div>
              <label>Tokens:</label>
              <strong>{userTokens}</strong>
            </div>
            {winAmountCounter > 0 && (
              <div>
                <label>Line win:</label>
                <strong>{winAmountCounter}</strong>
              </div>
            )}
          </div>
          <canvas id="renderCanvas"></canvas>
          <Script strategy="lazyOnload" src="/_MYAPP/vendor/slots.js"></Script>
          <div className="buttonsHolder">
            <div>
              <strong>Lines</strong>
              <DesignNumberInput min="1" max={maxLines} value={lineCount} onChange={(v) => { setLineCount(v) }} />
            </div>
            <button className={`${styles.mainButton} primaryButton spinButton`} onClick={doSpin}>
              {`Spin (${lineCount *  betAmount} Tokens)`}
            </button>
            <div>
              <strong>Bet</strong>
              <DesignNumberInput min="1" max={maxBet} value={betAmount} onChange={(v) => { setBetAmount(v) }} />
            </div>
          </div>
          <div>
            <button className={`${styles.mainButton}`}  onClick={doShowWinCombinations}>Show Win combinations</button>
          </div>
          {slotMultipler !== false && (
            <>
              {renderSlotMultipler()}
            </>
          )}
          {isBuyTokens && (
            <BuyTokensModal {...{
              activeWeb3,
              activeWallet: address,
              openConfirmWindow,
              addNotify,
              chainId,
              slotsContractAddress,
              bankTokenInfo,
              tokenPriceWei,
              onClose: () => { setIsBuyTokens(false) },
              onBuy: () => {
                setIsBuyTokens(false)
                updateUserSlotsState()
              }
            }} />
          )}
        </div>
      )}
    </div>
  );
};

export default Slots;
