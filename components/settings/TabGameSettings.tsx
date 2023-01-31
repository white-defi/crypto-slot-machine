import styles from "../../styles/Home.module.css"
import { useEffect, useState } from "react"
import { useStateUri, useStateUint } from "../../helpers/useState"
import toggleGroup from "../toggleGroup"
import iconButton from "../iconButton"
import InputColor from 'react-input-color'
import callSlotsMethod from "../../helpers/callSlotsMethod"

import contractData from "../../contracts/source/artifacts/SlotMachine.json"


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
  } = options

  const [ newChainId, setNewChainId ] = useState(storageData?.chainId)
  const [ newSlotsAddress, setNewSlotsAddress ] = useState(storageData?.slotsContractAddress)
  const [ slotsContract, setSlotsContract ] = useState(false)



  useEffect(() => {
    console.log('>>> use effect', newChainId, newSlotsAddress, activeWeb3)
    // const { activeWeb3 } = getActiveChain()
    if (newChainId && newSlotsAddress && activeWeb3) {
      
      const contract = new activeWeb3.eth.Contract(contractData.abi, newSlotsAddress)
      setSlotsContract(contract)
    }
  }, [newChainId, newSlotsAddress, activeWeb3] )

  /**** WIN COMBINATIONS ****/
  useEffect(() => {
    if (slotsContract) {
      doFetchWinCombinations()
    }
  }, [slotsContract])
  
  const [ newWinCombinations, setNewWinCombinations ] = useState(false)
  const [ isWinCombFetched, setIsWinCombFetched ] = useState(false)
  const [ isWinCombFetching, setIsWinCombFetching ] = useState(false)
  const [ isWinCombSaving, setIsWinCombSaving ] = useState(false)
  
  const doSaveWinCombinations = () => {
    openConfirmWindow({
      title: `Saving win combinations`,
      message: `Save win combinations to SlotMachine contract?`,
      onConfirm: () => {
        setIsWinCombSaving(true)
        addNotify(`Saving win combinations. Confirm transaction`)
        callSlotsMethod({
          activeWeb3,
          contractAddress: newSlotsAddress,
          method: 'setMultiplers',
          args: [
            newWinCombinations
          ],
          onTrx: (txHash) => {
            console.log('>> onTrx', txHash)
            addNotify(`Saving win combinations TX ${txHash}`, `success`)
          },
          onSuccess: (receipt) => {
            console.log('>> onSuccess', receipt)
            //addNotify(`NFT mint transaction broadcasted`, `success`)
          },
          onError: (err) => {
            console.log('>> onError', err)
            addNotify(`Fail save win combinations. ${err.message ? err.message : ''}`, `error`)
          },
          onFinally: (answer) => {
            setIsWinCombSaving(false)
            addNotify(`Win combinations saved`, `success`)
          }
        })
      }
    })
  }

  const doFetchWinCombinations = () => {
    setIsWinCombFetched(false)
    setIsWinCombFetching(true)
    slotsContract.methods.getMultiplers().call().then((answer) => {
      setNewWinCombinations(answer)
      setIsWinCombFetching(false)
      setIsWinCombFetched(true)
    }).catch((err) => {
      console.log('Fail doFetchWinCombinations', err)
      setIsWinCombFetching(false)
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
  
  return {
    render: () => {
      return (
        <>
          <div className={styles.adminForm}>
            {toggleGroup({
              title: `Design - Images and Colors`,
              isOpened: true,
              onToggle: () => {},
              content: (
                <>
                  <div className={styles.subFormInfo}>
                    <div className={styles.subForm}>
                    </div>
                  </div>
                  <div className="slotsPreview">
                  </div>
                </>
              )
            })}
            {toggleGroup({
              title: `Base game rules`,
              isOpened: true,
              content: (
                <div className={styles.subFormInfo}>
                  <div className={styles.subForm}>
                    <div className={styles.infoRow}>
                      <label>Max bet:</label>
                      <div>
                        <div>
                          <input type="number" value="0" />
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Max lines:</label>
                      <div>
                        <div>
                          <input type="number" min="1" max="20" value="0" />
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Wild symbol:</label>
                      <div>
                        <div>
                          <select>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Flush random:</label>
                      <div>
                        <div>
                          <button>Flush random generator</button>
                        </div>
                        <strong>
                          It is recommended to periodically flash the random number generator with the admin seed, to avoid predicting the state of the contract and cheating
                        </strong>
                      </div>
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
              isOpened: true,
              onToggle: () => {},
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
                  {isWinCombFetching && (
                    <>
                      <div>Fetching...</div>
                    </>
                  )}
                  {isWinCombFetched && (
                    <>
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
                                  <img src={getDesign(`symbol_${symbolIndex}`, `uri`)} />
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
                        <button disabled={isWinCombSaving} onClick={doSaveWinCombinations}>
                          {isWinCombSaving
                            ? `Saving win combinations...`
                            : `Save Win combinations`
                          }
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )
    }
  }
}