import styles from "../../styles/Home.module.css"
import { useEffect, useState } from "react"
import { useStateUri, useStateUint, useStateFloat } from "../../helpers/useState"
import toggleGroup from "../toggleGroup"
import iconButton from "../iconButton"
import InputColor from 'react-input-color'
import ImageInput from "../ImageInput"
import callSlotsMethod from "../../helpers/callSlotsMethod"
import fetchSlotsMachine from "../../helpers/fetchSlotsMachine"
import Script from 'next/script'

import contractData from "../../contracts/source/artifacts/SlotMachine.json"
import { getRandSalt } from "../../helpers/getRandSalt"
import { fromWei, toWei } from "../../helpers/wei"
import fetchTokenInfo from "../../helpers/fetchTokenInfo"

export default function TabMain(options) {
  const {
    setDoReloadStorage,
    saveStorageConfig,
    openConfirmWindow,
    addNotify,
    getActiveChain,
    activeWeb3,
    storageData,
    chainId,
    getDesign,
    slotsContractAddress,
    storageDesign,
  } = options

  const [ newChainId, setNewChainId ] = useState(storageData?.chainId)
  const [ newSlotsAddress, setNewSlotsAddress ] = useState(storageData?.slotsContractAddress)
  const [ slotsContract, setSlotsContract ] = useState(false)
  const [ slotsEngine, setSlotsEngine ] = useState(false)


  /* WAIT SLOT MACHINE RENDER ENGINE */
  useEffect(() => {
    if (true) return
    const waitCanvas = setInterval(() => {
      const canvas = document.getElementById(`SlotsPreview`)
      if (canvas && window.SLOT_MACHINE) {
        console.log(storageData?.design)
        setSlotsEngine(window.SLOT_MACHINE)
        window.SLOT_MACHINE.init({
          canvasId: 'SlotsPreview',
          ownAssets: {
            images: {
              symbol_0: getDesign(`symbol_0`),
              symbol_1: getDesign(`symbol_1`),
              symbol_2: getDesign(`symbol_2`),
              symbol_3: getDesign(`symbol_3`),
              symbol_4: getDesign(`symbol_4`),
              symbol_5: getDesign(`symbol_5`),
              symbol_6: getDesign(`symbol_6`),
              symbol_7: getDesign(`symbol_7`),
              symbol_8: getDesign(`symbol_8`),
              reel_bg:  getDesign(`reel_bg`),
              win_animation: getDesign(`win_animation`),
            },
            sounds: {
              win: `/_MYAPP/vendor/sounds/win.wav`,
              reel_stop: `/_MYAPP/vendor/sounds/reel_stop.wav`
            }
          }
        })
        clearInterval(waitCanvas)
      }
    }, 100)
    return () => { clearInterval(waitCanvas) }
  }, [])

  const updateSlotEngine = () => {
    console.log('>>> update slot engine')
    if (slotsEngine) {
      console.log('>>> update slot engine')
      slotsEngine.updateAssets({
        images: {
          symbol_0: newSlotsImages.symbol_0,
          symbol_1: newSlotsImages.symbol_1,
          symbol_2: newSlotsImages.symbol_2,
          symbol_3: newSlotsImages.symbol_3,
          symbol_4: newSlotsImages.symbol_4,
          symbol_5: newSlotsImages.symbol_5,
          symbol_6: newSlotsImages.symbol_6,
          symbol_7: newSlotsImages.symbol_7,
          symbol_8: newSlotsImages.symbol_8,
          reel_bg:  newReelBg,
          win_animation: newWinAnimation
          
        }
      })
    }
  }
  useEffect(() => {
    console.log('>> useEffect', newReelBg, newWinAnimation)
    updateSlotEngine()
  }, [ newReelBg, newWinAnimation ] )
  /***********************************/

  useEffect(() => {
    console.log('>>> use effect', newChainId, newSlotsAddress, activeWeb3)
    // const { activeWeb3 } = getActiveChain()
    if (newChainId && newSlotsAddress && activeWeb3) {
      
      const contract = new activeWeb3.eth.Contract(contractData.abi, newSlotsAddress)
      setSlotsContract(contract)
    }
  }, [newChainId, newSlotsAddress, activeWeb3] )

  const [ newMaxBet, setNewMaxBet ] = useStateUint(0, { notZero: true })
  const [ newMaxLines, setNewMaxLines ] = useStateUint(0, { notZero: true })
  const [ newTokenPrice, setNewTokenPrice ] = useStateFloat(0, { notZero: true })
  const [ newWildSlot, setNewWildSlot ] = useStateUint(0)
  const [ currencyToken, setCurrencyToken ] = useState(false)
  const [ currencyTokenInfo, setCurrencyTokenInfo ] = useState(false)
  
  const [ isSlotMachineFetching, setIsSlotMachineFetching ] = useState(false)
  const [ isSlotMachineFetched, setIsSlotMachineFetched ] = useState(false)
  
  useEffect(() => {
    if (newChainId && newSlotsAddress && activeWeb3 && !isSlotMachineFetching) {
      setIsSlotMachineFetching(true)
      fetchSlotsMachine({
        activeWeb3,
        chainId: newChainId,
        address: newSlotsAddress,
      }).then((answer) => {
        setIsSlotMachineFetched(true)
        setIsSlotMachineFetching(false)
        
        setNewWinCombinations(answer.winCombinations)
        setNewMaxBet(answer.maxBet)
        setNewMaxLines(answer.maxLines)
        setNewWildSlot(answer.wildSlot)
        setCurrencyToken(answer.tokenCurrency)
        
        fetchTokenInfo(answer.tokenCurrency, newChainId).then((tokenInfo) => {
          setCurrencyTokenInfo(tokenInfo)
          setNewTokenPrice(fromWei(answer.tokenPrice, tokenInfo.decimals))
        }).catch((e) => {
          console.log('>>> err', e)
          
        })
      }).catch((err) => {
        console.log('>>> err', err)
        setIsSlotMachineFetching(false)
      })
        
    }
  }, [ newChainId, newSlotsAddress, activeWeb3 ])
  /**** WIN COMBINATIONS ****/
  
  const [ newWinCombinations, setNewWinCombinations ] = useState(false)
  const [ isSaveSlotsChanges, setIsSaveSlotsChanges ] = useState(false)
  
  const doSaveSlotsChanges = () => {
    openConfirmWindow({
      title: `Saving changes to SlotsMachine contract`,
      message: `Save changes to SlotMachine contract?`,
      onConfirm: () => {
        setIsSaveSlotsChanges(true)
        addNotify(`Saving changes. Confirm transaction`)
        callSlotsMethod({
          activeWeb3,
          contractAddress: newSlotsAddress,
          method: 'saveSettings',
          args: [
            toWei(newTokenPrice, currencyTokenInfo.decimals),
            newMaxBet,
            newMaxLines,
            newWildSlot,
            newWinCombinations
          ],
          onTrx: (txHash) => {
            console.log('>> onTrx', txHash)
            addNotify(`Saving changes TX ${txHash}`, `success`)
          },
          onSuccess: (receipt) => {
            console.log('>> onSuccess', receipt)
          },
          onError: (err) => {
            console.log('>> onError', err)
            setIsSaveSlotsChanges(false)
            addNotify(`Fail save changes. ${err.message ? err.message : ''}`, `error`)
          },
          onFinally: (answer) => {
            setIsSaveSlotsChanges(false)
            addNotify(`Changes saved`, `success`)
          }
        })
      }
    })
  }

  const setWinCombination = (symbolIndex, matchCount, winReward) => {
    setNewWinCombinations((prev) => {
      const newMatch = [ ...prev ]
      const _prevMatchLine = [ ...prev[symbolIndex]]
      _prevMatchLine[matchCount] = winReward
      newMatch[symbolIndex] = _prevMatchLine
      return newMatch
    })
  }
  /***********************************************/
  const [ newReelBg, setNewReelBg ] = useState(getDesign(`reel_bg`))
  const [ newWinAnimation, setNewWinAnimation ] = useState(getDesign(`win_animation`))
  const [ newSlotSize, setNewSlotSize ] = useState(getDesign(`slotSize`))
  
  const [ newSlotsImages, setNewSlotsImages ] = useState({
    symbol_0: getDesign(`symbol_0`),
    symbol_1: getDesign(`symbol_1`),
    symbol_2: getDesign(`symbol_2`),
    symbol_3: getDesign(`symbol_3`),
    symbol_4: getDesign(`symbol_4`),
    symbol_5: getDesign(`symbol_5`),
    symbol_6: getDesign(`symbol_6`),
    symbol_7: getDesign(`symbol_7`),
    symbol_8: getDesign(`symbol_8`)
  })
  
  const onChangeSlotImage = (slotIndex, newValue) => {
    setNewSlotsImages((prev) => {
      return {
        ...prev,
        [`symbol_${slotIndex}`]: newValue,
      }
    })
    updateSlotEngine()
  }
  const [ isSaveImages, setIsSaveImages ] = useState(false)
  
  const doSaveImages = () => {
    openConfirmWindow({
      title: `Save design images`,
      message: `Save design changes?`,
      onConfirm: () => {
        setIsSaveImages(true)
        saveStorageConfig({
          onBegin: () => {
            addNotify(`Confirm transaction`)
          },
          onReady: () => {
            setIsSaveImages(false)
            addNotify(`Changed saved`, `success`)
          },
          onError: (err) => {
            setIsSaveImages(false)
            addNotify(`Fail save changes. ${err.message ? err.message : ''}`, `error`)
          },
          newData: {
            design: {
              ...newSlotsImages,
              reel_bg: newReelBg,
              win_animation: newWinAnimation,
              slotSize: newSlotSize,
            }
          }
        })
      }
    })
  }

  const [ isFlushRandom, setIsFlushRandom ] = useState(false)
  const doFlushRandom = () => {
    openConfirmWindow({
      title: `Flushing random generator`,
      message: `Flush random generator?`,
      onConfirm: () => {
        const randSalt = getRandSalt()
        setIsFlushRandom(true)
        addNotify(`Flushing random generator. Confirm transaction`)
        callSlotsMethod({
          activeWeb3,
          contractAddress: newSlotsAddress,
          method: 'flushRandom',
          args: [
            randSalt
          ],
          onTrx: (txHash) => {
            console.log('>> onTrx', txHash)
            addNotify(`Flusing random generator TX ${txHash}`, `success`)
          },
          onSuccess: (receipt) => {
            console.log('>> onSuccess', receipt)
            //addNotify(`NFT mint transaction broadcasted`, `success`)
          },
          onError: (err) => {
            console.log('>> onError', err)
            setIsFlushRandom(false)
            addNotify(`Fail flushing random renerator. ${err.message ? err.message : ''}`, `error`)
          },
          onFinally: (answer) => {
            setIsFlushRandom(false)
            addNotify(`Random generator flushed`, `success`)
          }
        })
      }
    })
  }
  
  const [ isTabOpened, setIsTabOpened ] = useState({})
  const onToggleTab = (tabKey) => {
    setIsTabOpened((prev) => {
      return {
        ...prev,
        [`${tabKey}`]: (prev[tabKey]) ? !prev[tabKey] : true
      }
    })
  }

  return {
    render: () => {
      return (
        <>
          <div className={styles.adminForm}>
            {isSlotMachineFetching && (
              <>
                <div>Fetching...</div>
              </>
            )}
            {isSlotMachineFetched && currencyTokenInfo && (
              <>
                {toggleGroup({
                  title: `Flush Random generator`,
                  isOpened: isTabOpened.FlushGenerator,
                  onToggle: () => { onToggleTab(`FlushGenerator`) },
                  content: (
                    <div className={styles.subFormInfo}>
                    
                      <div>
                        <strong className={styles.infoBoxGreen}>
                          It is recommended to periodically flash the random number generator with the admin seed, to avoid predicting the state of the contract and cheating
                        </strong>
                      </div>
                      <div className={styles.actionsRow}>
                        <button disabled={isFlushRandom} onClick={doFlushRandom}>
                          {isFlushRandom
                            ? `Flushing random generator...`
                            : `Flush random generator`
                          }
                        </button>
                      </div>

                    </div>
                  )
                })}
                {/*
                {toggleGroup({
                  title: `SlotMachine preview`,
                  isOpened: isTabOpened.SlotsPreview,
                  onToggle: () => { onToggleTab(`SlotsPreview`) },
                  content: (
                    <>
                      <canvas id="SlotsPreview" width="320" height="194"></canvas>
                      <Script strategy="lazyOnload" src="/_MYAPP/vendor/slots.js"></Script>
                    </>
                  )
                })}
                */}
                {toggleGroup({
                  title: `Design - Images and Colors`,
                  isOpened: isTabOpened.ImagesAndColors,
                  onToggle: () => { onToggleTab(`ImagesAndColors`) },
                  content: (
                    <>
                      <div className={styles.subFormInfo}>
                        <div className={styles.subForm}>
                          <div className={styles.infoRow}>
                            <label>Slot size (px):</label>
                            <div>
                              <input type="number" min="32" value={newSlotSize} onChange={(e) => { setNewSlotSize(e.target.value) } } />
                            </div>
                          </div>
                          <div className={styles.infoRow}>
                            <label>Reel background:</label>
                            <div>
                              <div>
                                <ImageInput value={newReelBg} onChange={(val) => setNewReelBg(val)} />
                              </div>
                            </div>
                          </div>
                          <div className={styles.infoRow}>
                            <label>Win animation:</label>
                            <div>
                              <div>
                                <ImageInput value={newWinAnimation} onChange={(val) => setNewWinAnimation(val) } />
                              </div>
                            </div>
                          </div>
                          <div className={styles.infoRow}>
                            <label>Win animation frames count:</label>
                            <div>
                              <div>
                                <input type="number" value="0" />
                              </div>
                              <div>
                                <strong>Кол-во кадров (расчетное 14)</strong>
                              </div>
                            </div>
                          </div>
                          {toggleGroup({
                            title: `Slots symbols images`,
                            isOpened: isTabOpened.SlotsImages,
                            onToggle: () => { onToggleTab(`SlotsImages`) },
                            content: (
                              <>
                                {[0,1,2,3,4,5,6,7,8].map((symbolIndex) => {
                                  return (
                                    <div className={styles.infoRow} key={symbolIndex}>
                                      <label>Symbol #{symbolIndex+1}</label>
                                      <div>
                                        <div>
                                          <ImageInput value={newSlotsImages[`symbol_${symbolIndex}`]} onChange={(val) => { onChangeSlotImage(symbolIndex, val) }} />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })}
                          <div className={styles.actionsRow}>
                            <button disabled={isSaveImages} onClick={doSaveImages}>
                              {isSaveImages
                                ? `Saving...`
                                : `Save design changes`
                              }
                            </button>
                          </div>
                        </div>
                        
                      </div>
                      
                      <div className="slotsPreview">
                        
                      </div>
                    </>
                  )
                })}
                {toggleGroup({
                  title: `Base game rules`,
                  isOpened: isTabOpened.GameRules,
                  onToggle: () => { onToggleTab(`GameRules`) },
                  content: (
                    <div className={styles.subFormInfo}>
                      <div className={styles.subForm}>
                        <div className={styles.infoRow}>
                          <label>Max bet:</label>
                          <div>
                            <div>
                              <input type="number" value={newMaxBet} onChange={(e) => setNewMaxBet(e)} />
                            </div>
                          </div>
                        </div>
                        <div className={styles.infoRow}>
                          <label>Max lines:</label>
                          <div>
                            <div>
                              <input type="number" min="1" max="20" value={newMaxLines} onChange={(e) => setNewMaxLines(e)} />
                            </div>
                          </div>
                        </div>
                        <div className={styles.infoRow}>
                          <label>Token price:</label>
                          <div>
                            <div>
                              <input type="number" value={newTokenPrice} onChange={(e) => setNewTokenPrice(e)} />
                              <strong>{currencyTokenInfo.symbol}</strong>
                            </div>
                          </div>
                        </div>
                        <div className={styles.infoRow}>
                          <label>Wild symbol:</label>
                          <div>
                            <div>
                              <select value={newWildSlot} onChange={(e) => setNewWildSlot(e)}>
                                <option value="1000">No wild</option>
                                {[0,1,2,3,4,5,6,7,8].map((symbolIndex) => {
                                  return (
                                    <option value={symbolIndex} key={symbolIndex}>Symbol #{symbolIndex + 1}</option>
                                  )
                                })}
                              </select>
                            </div>
                            <strong>
                              Символ, который заменяется на подходящий в комбинации
                            </strong>
                          </div>
                        </div>
                        <div className={styles.actionsRow}>
                          <button disabled={isSaveSlotsChanges} onClick={doSaveSlotsChanges}>
                            {isSaveSlotsChanges
                              ? `Saving changes...`
                              : `Save changes`
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {/*
                {toggleGroup({
                  title: `Win lines`,
                  isOpened: true,
                  onToggle: () => {},
                  content: (
                    <>
                      <div>Win lines</div>
                      <ul>
                        <li>
                          <label>Line #1</label>
                          
                        </li>
                      </ul>
                    </>
                  )
                })}
                */}
                {toggleGroup({
                  title: `Win combinations`,
                  isOpened: isTabOpened.WinCombinations,
                  onToggle: () => { onToggleTab(`WinCombinations`) },
                  content: (
                    <div className="winCombinations">
                      <style jsx>
                      {`
                        .winCombinations {
                          width: 100%;
                          padding: 5px;
                        }
                        .winCombinations TABLE {
                          width: 100%;
                          border: 2px solid #FFF;
                        }
                        .winCombinations TD {
                          font-size: 10pt;
                          padding: 5px;
                        }
                        .winCombinations THEAD TD {
                          text-align: center;
                          font-weight: bold;
                          background: #0773b3;
                          font-size: 12px;
                          border-bottom: 2px solid #FFF;
                        }
                        .winCombinations TBODY TD {
                          padding: 2px;
                        }
                        .winCombinations TD INPUT {
                          width: 100%;
                          background: transparent;
                          color: #FFF;
                          font-weight: bold;
                          border: 0px;
                          text-align: center;
                          outline: 1px solid #FFF;
                        }
                        .winCombinations TD INPUT:focus {
                          background: #FFF;
                          color: #000;
                        }
                        .winCombinations TD IMG {
                          width: 32px;
                          vertical-align: middle;
                        }
                        .winCombinations TBODY TD:first-child {
                          text-align: center;
                          vertical-align: middle;
                        }
                      `}
                      </style>
                      <table cellPadding="0" cellSpacing="0">
                        <thead>
                          <tr>
                            <td>Symbol</td>
                            <td>Match 1</td>
                            <td>Match 2</td>
                            <td>Match 3</td>
                            <td>Match 4</td>
                            <td>Match 5</td>
                          </tr>
                        </thead>
                        <tbody>
                          {newWinCombinations.map((combinations, symbolIndex) => {
                            return (
                              <tr key={symbolIndex}>
                                <td>
                                  <span>#{(symbolIndex+1)}</span>
                                  <img src={newSlotsImages[`symbol_${symbolIndex}`]} />
                                </td>
                                {combinations.map((value, matchCount) => {
                                  return (
                                    <td key={matchCount}>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newWinCombinations[symbolIndex][matchCount]}
                                        onChange={(e) => { setWinCombination(symbolIndex, matchCount, e.target.value) }}
                                      />
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      <div className={styles.actionsRow}>
                        <button disabled={isSaveSlotsChanges} onClick={doSaveSlotsChanges}>
                          {isSaveSlotsChanges
                            ? `Saving win combinations...`
                            : `Save Win combinations`
                          }
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      )
    }
  }
}