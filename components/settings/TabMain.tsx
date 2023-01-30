import styles from "../../styles/Home.module.css"
import { useEffect, useState } from "react"
import { useStateUri, useStateUint } from "../../helpers/useState"
import { defaultDesign } from "../../helpers/defaultDesign"
import { getUnixTimestamp } from "../../helpers/getUnixTimestamp"
import fetchTokenInfo from "../../helpers/fetchTokenInfo"
import deploySlotsMachine from "../../helpers/deploySlotsMachine"

import adminFormRow from "../adminFormRow"

import toggleGroup from "../toggleGroup"
import iconButton from "../iconButton"
import InputColor from 'react-input-color'
import {
  AVAILABLE_NETWORKS_INFO,
  CHAIN_INFO,
  CHAIN_EXPLORER_LINK
} from "../../helpers/constants"

import { fromWei, toWei } from "../../helpers/wei"

const CHAINS_LIST = (() => {
  const ret = Object.keys(AVAILABLE_NETWORKS_INFO).map((k) => {
    return {
      id: AVAILABLE_NETWORKS_INFO[k].networkVersion,
      title: AVAILABLE_NETWORKS_INFO[k].chainName,
    }
  })
  ret.unshift({
    id: 0,
    title: `Select Blockchain`,
  })
  return ret
})()

export default function TabMain(options) {
  const {
    setDoReloadStorage,
    saveStorageConfig,
    openConfirmWindow,
    addNotify,
    getActiveChain,
    storageData,
  } = options

  const [ newChainId, setNewChainId ] = useState(storageData?.chainId)
  const [ newSlotsContractAddress, setNewSlotsContractAddress ] = useState(storageData?.slotsContractAddress)
  const [ newBankTokenAddress, setNewBankTokenAddress ] = useState(storageData?.bankTokenAddress)
  const [ newTokenPrice, setNewTokenPrice ] = useState(1)

  const [ isDeployOpened, setIsDeployOpened ] = useState(false)
  const [ isContractFetching, setIsContractFetching ] = useState(false)
  
  const [ newBankTokenInfo, setNewBankTokenInfo ] = useState(storageData?.bankTokenInfo)
  const [ isBankTokenFetching, setIsBankTokenFetching ] = useState(false)
  const [ isBankTokenFetched, setIsBankTokenFetched ] = useState(storageData?.tokenInfo?.address !== undefined)

  const [ isSaveToStorage, setIsSaveToStorage ] = useState(false)
  
  const doSaveToStorage = () => {
    openConfirmWindow({
      title: `Save to storage`,
      message: `Save changes to storage config?`,
      onConfirm: () => {
        setIsSaveToStorage(true)
        saveStorageConfig({
          onBegin: () => {
            addNotify(`Confirm transaction`)
          },
          onReady: () => {
            setIsSaveToStorage(false)
            addNotify(`Changed saved`, `success`)
          },
          onError: (err) => {
            setIsSaveToStorage(false)
            addNotify(`Fail save changes. ${err.message ? err.message : ''}`, `error`)
          },
          newData: {
            chainId: newChainId,
            slotsContractAddress: newSlotsContractAddress,
            bankTokenAddress: newBankTokenAddress,
            bankTokenInfo: newBankTokenInfo,
            tokenPrice: newTokenPrice
          }
        })
      }
    })
  }
  
  const doBankFetchTokenInfo = () => {
    if (newChainId) {
      setIsBankTokenFetched(false)
      setIsBankTokenFetching(false)
      setNewBankTokenInfo({})
      addNotify(`Fetching token info`)
      fetchTokenInfo(newBankTokenAddress, newChainId).then((_tokenInfo) => {
        setIsBankTokenFetching(false)
        setNewBankTokenInfo(_tokenInfo)
        setIsBankTokenFetched(true)
        addNotify(`Token info fetched`, `success`)
      }).catch((err) => {
        addNotify(`Fail fetch token info. ${err.message ? err.message : ''}`, `error`)
        setIsBankTokenFetching(false)
      })
    } else {
      addNotify(`Fail fetch. Select work chain first`, `error`)
    }
  }
  
  const cancelDeploy = () => {
    setIsDeployOpened(false)
  }
  const openDeploySlotsMachine = () => {
    setIsDeployOpened(true)
  }

  const [ isDeploying, setIsDeploying ] = useState(false)
  
  const doDeployContract = () => {
    if (!newChainId) return addNotify(`Fail. Select work chain first`, `error`)
    if (!isBankTokenFetched) return addNotify(`Fail. Fetch token info first`, `error`)
    const {
      activeChainId,
      activeWeb3,
    } = getActiveChain()
    
    const activeChainInfo = CHAIN_INFO(activeChainId)
    if (newChainId
      && isBankTokenFetched
      && newBankTokenAddress
    ) {
      openConfirmWindow({
        title: `Deploying SlotsMachine contract`,
        message: `Deploy SlotsMachine contract at ${activeChainInfo.chainName} (${activeChainId})?`,
        onConfirm: () => {
          setIsDeploying(true)
          addNotify(`Deploying SlotsMachine. Confrirm transaction`)
          
          deploySlotsMachine({
            activeWeb3,
            bankToken: newBankTokenAddress,
            tokenPrice: toWei(newTokenPrice, newBankTokenInfo.decimals).toString(),
            onTrx: (hash) => {
              addNotify(`SlotsMachine contract deploy TX ${hash}...`, `success`)
            },
            onSuccess: (newContractAddress) => {
              try {
                addNotify(`SlotsMachine contract deployed. Now save settings`, `success`)
                setNewSlotsContractAddress(newContractAddress)
                setIsDeploying(false)
                setIsDeployOpened(false)
              } catch (err) {
                console.log('>>> onSuccess error', err)
              }
            },
            onError: (err) => {
              addNotify(`Fail deploy Lottery contract. ${(err.message ? err.message : '')}`, `error`)
              setIsDeploying(false)
              console.log(err)
            }
          }).catch((err) => {
            setIsDeploying(false)
            addNotify(`Fail deploy Lottery contract. ${err.message ? err.message : ''}`, `error`)
          })
        }
      })
    }
  }

  return {
    render: () => {
      return (
        <>
          <div className={styles.adminForm}>
            {adminFormRow({
              label: `Work blockchain ID`,
              type: `list`,
              values: CHAINS_LIST,
              value: newChainId,
              onChange: setNewChainId
            })}
            {!isDeployOpened ? (
              <>
                {adminFormRow({
                  label: `Slots machine contract`,
                  type: `address`,
                  value: newSlotsContractAddress,
                  onChange: setNewSlotsContractAddress,
                  placeholder: `Enter address of SlotsMachine contract`,
                  buttons: (
                    <>
                      {/*
                      <button disabled={isLotteryContractFetching || isLotteryContractDeploying} className={styles.secondaryButton} onClick={doFetchLotteryInfo}>
                        {isLotteryContractFetching ? `Fetching info` : `Fetch info`}
                      </button>
                      */}
                      <button disabled={isDeploying || isContractFetching} className={styles.secondaryButton} onClick={openDeploySlotsMachine}>
                        Deploy new
                      </button>
                    </>
                  )
                })}
                {isBankTokenFetched && newBankTokenInfo && newBankTokenInfo.address && (
                  <div className={styles.subFormInfo}>
                    <h3>Token info</h3>
                    {/*
                    <div className={styles.subForm}>
                      <div className={styles.infoRow}>
                        <label>Address:</label>
                        <span>
                          <b>{newTokenInfo.address}</b>
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <label>Symbol:</label>
                        <span>
                          <b>{newTokenInfo.symbol}</b>
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <label>Name:</label>
                        <span>
                          <b>{newTokenInfo.name}</b>
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <label>Decimals:</label>
                        <span>
                          <b>{newTokenInfo.decimals}</b>
                        </span>
                      </div>
                    </div>
                    */}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.subFormInfo}>
                  <h3>Deploy new SlotsMachine contract options</h3>
                  <div className={styles.subForm}>
                    {adminFormRow({
                      label: `Bank token`,
                      type: `address`,
                      value: newBankTokenAddress,
                      onChange: setNewBankTokenAddress,
                      placeholder: `Ender address of Bank ERC20 token`,
                      buttons: (
                        <button disabled={isBankTokenFetching} onClick={doBankFetchTokenInfo}>
                          {isBankTokenFetching ? `Fetching` : `Fetch token info`}
                        </button>
                      )
                    })}
                    {isBankTokenFetched && newBankTokenInfo && newBankTokenInfo.address && (
                      <div className={styles.infoTable}>
                        <h3>Token info</h3>
                        <div className={styles.infoRow}>
                          <label>Symbol:</label>
                          <span>
                            <b>{newBankTokenInfo.symbol}</b>
                          </span>
                        </div>
                        <div className={styles.infoRow}>
                          <label>Name:</label>
                          <span>
                            <b>{newBankTokenInfo.name}</b>
                          </span>
                        </div>
                        <div className={styles.infoRow}>
                          <label>Decimals:</label>
                          <span>
                            <b>{newBankTokenInfo.decimals}</b>
                          </span>
                        </div>
                        <div className={styles.subForm}>
                          <div className={styles.infoRow}>
                            <label>Game token price:</label>
                            <div>
                              <div>
                                <input type="number" value={newTokenPrice} onChange={(e) => { setNewTokenPrice(e.target.value) }} />
                                <strong>{newBankTokenInfo.symbol}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.actionsRow}>
                    <button disabled={isDeploying} onClick={doDeployContract}>
                      {isDeploying ? `Deploying` : `Deploy SlotsMachine contract`}
                    </button>
                    <button disabled={isDeploying} onClick={cancelDeploy}>
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className={styles.actionsRowMain}>
              <button disabled={isSaveToStorage} onClick={doSaveToStorage} className={styles.secondaryButton}>
                {isSaveToStorage ? `Saving...` : `Save to storage config`}
              </button>
            </div>
          </div>
        </>
      )
    },
  }
}