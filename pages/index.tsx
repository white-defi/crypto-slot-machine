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
  } = props
  const [ chainId, setChainId ] = useState(storageData?.chainId)
  const [ slotsContractAddress, setSlotsContractAddress ] = useState(storageData?.slotsContractAddress)
  

  const [activeWeb3, setActiveWeb3] = useState(false)
  const [activeChainId, setActiveChainId] = useState(false)
  const [isWalletConecting, setIsWalletConnecting] = useState(false)
  const [address, setAddress] = useState(false)

  const [slotsContract, setSlotsContract] = useState(false)


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

  const [slotMachine, setSlotMachine] = useState(false)
  
  useEffect(() => {
    if (activeWeb3 && isMetamaskConnected) {
      const waitCanvas = setInterval(() => {
        console.log('>>> waitCanvas')
        const canvas = document.getElementById(`renderCanvas`)
        if (canvas && window.SLOT_MACHINE) {
          setSlotMachine(window.SLOT_MACHINE)
          window.SLOT_MACHINE.init({
            canvasId: 'renderCanvas',
          })
          const multiplers = window.SLOT_MACHINE.getMultiplers().map((data, key) => {
            return {
              id: key,
              data: data.reverse()
            }
          }).sort((a,b) => {
            return a.data[0] > b.data[0] ? -1 : 1
          })
          console.log('>>> multiplers', multiplers)
          setSlotMultipler((prev) => {
            return multiplers
          })
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

  const [ slotMultipler, setSlotMultipler ] = useState(false)

  const [ userTokens, setUserTokens ] = useState(0)
  const [ userTokensAdd, setUserTokensAdd ] = useState(0)
  const [ currentLineWin, setCurrentLineWin ] = useState(0)
  const [ currentSlots, setCurrentSlots ] = useState([0, 0, 0, 0, 0])
  const [ winAmountCounter, setWinAmountCounter ] = useState(0)
  const [ winLines, setWinLines ] = useState([])
  const [ winLinesAmount, setWinLinesAmount ] = useState([])
  const [ winLinesSwitchCounter, setWinLinesSwitchCounter ] = useState(0)
  const winLinesSwitchDeplay = 2;
  
  const [ spinResult, setSpinResult ] = useState({})
  
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (slotMachine) {
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
            setWinAmountCounter(0)
            slotMachine.hideActiveWinLine()
          }
        }
      }
    }, 1000)
    return () => { clearInterval(timer) }
  })
  
  const doTest = () => {
    console.log('do test')
    setUserTokensAdd(userTokensAdd + 100)
    const multiplers = slotMachine.getMultiplers().map((data, key) => {
    console.log(data,key)
      return {
        id: key,
        data: data.reverse()
      }
    }).sort((a,b) => {
      return a.data[0] > b.data[0] ? -1 : 1
    })
    
    console.log(multiplers)
    
  }
  
  useEffect(() => {
    if (slotMachine && slotMachine.isInited() && spinResult && spinResult.spinWinLines) {
      console.log('>>> spinResult',spinResult)
      
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
        lineCount - 1,
        `0x${calcedHash}`
      ],
      onTrx: (txHash) => {
        console.log('>> onTrx', txHash)
        slotMachine.setPreviewWinLines(-1)
        slotMachine.spin()
        //addNotify(`NFT mint TX ${txHash}`, `success`)
      },
      onSuccess: (receipt) => {
        console.log('>> onSuccess', receipt)
        //addNotify(`NFT mint transaction broadcasted`, `success`)
      },
      onError: (err) => {
        console.log('>> onError', err)
        //addNotify(`Fail mint NFT. ${err.message ? err.message : ''}`, `error`)
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
          console.log('>>> stoped', spinWinLines)
          setUserTokens((prev) => {
            return prev + Number(spinData.winAmount)
          })
          setSpinResult(spinData)
        })
      }
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
  const renderSlotMultipler = () => {
    console.log('>>> render')
    let iKey = 0
    return (
      <div className="winTable">
        <style jsx>
        {`
          .winTable IMG {
            display: block;
            width: 32px;
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
        `}
        </style>
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
      </div>
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

  const [betAmount, setBetAmount] = useState(1)
  const [lineCount, setLineCount] = useState(1)
  useEffect(() => {
    console.log('>>> lineCount', lineCount, slotMachine, slotMachine ? slotMachine.isInited() : false)
    if (slotMachine && slotMachine.isInited()) {
      slotMachine.render_reel()
      for (let line = 0; line < lineCount; line++ ) {
        console.log('>>> render win line', line)
        slotMachine.setPreviewWinLines(line)
      }
    }
  }, [lineCount, slotMachine])

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
            }
            .slotMachine .balanceHolder {
              display: flex;
              width: 320px;
              justify-content: space-between;
              font-size: 11pt;
            }
            .slotMachine .buttonsHolder {
              display: flex;
              width: 320px;
              justify-content: space-between;
              font-size: 11pt;
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
          <div>Slot machine</div>
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
              <input type="number" min="1" max="20" value={lineCount} onChange={(e) => { setLineCount(e.target.value) }} />
            </div>
            <div>
              <strong>Bet</strong>
              <input type="number" min="1" max="100" value={betAmount} onChange={(e) => { setBetAmount(e.target.value) }} />
            </div>
          </div>
          <div>
            <button className={`${styles.mainButton} primaryButton`} onClick={doSpin}>
              {`Spin (${lineCount *  betAmount} Tokens)`}
            </button>
          </div>
          <div>
            <button onClick={doTest}>Test</button>
          </div>
          <div>
            <button onClick={doStop}>Stop</button>
          </div>
          {slotMultipler !== false && (
            <>
              {renderSlotMultipler()}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Slots;
