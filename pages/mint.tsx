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


const debugLog = (msg) => { console.log(msg) }

const Slots: NextPage = (props) => {
  const {
    storageData,
    isOwner,
    addNotify,
    getText,
    getDesign,
  } = props
  const [ chainId, setChainId ] = useState(storageData?.chainId)

  const [isWalletConecting, setIsWalletConnecting] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [isMinted, setIsMinted] = useState(false)
  const [address, setAddress] = useState(false)

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

  useEffect(() => {
    debugLog('on useEffect activeWeb3 initOnWeb3Ready')
    if (chainId) {
      initOnWeb3Ready()
    }
  }, [activeWeb3, chainId])


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


  const mintChainInfo = CHAIN_INFO(chainId)
  return (
    <div className={styles.container}>
      {navBlock(`slots`, isOwner)}
      {logoBlock({
        getText,
        getDesign
      })}
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
        <>
          
        </>
      )}
    </div>
  );
};

export default Slots;
