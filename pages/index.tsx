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

const debugLog = (msg) => { console.log(msg) }


const Slots: NextPage = (props) => {
  const {
    storageData,
    isOwner,
    addNotify,
    getText,
    getDesign,
  } = props
  const [ chainId, setChainId ] = useState(5 || storageData?.chainId)

  const [activeWeb3, setActiveWeb3] = useState(false)
  const [activeChainId, setActiveChainId] = useState(false)
  const [isWalletConecting, setIsWalletConnecting] = useState(false)
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

  const [slotMachine, setSlotMachine] = useState(false)
  useEffect(() => {
    if (activeWeb3 && isMetamaskConnected) {
      const waitCanvas = setInterval(() => {
        const canvas = document.getElementById(`renderCanvas`)
        if (canvas && window.SLOT_MACHINE) {
          setSlotMachine(window.SLOT_MACHINE)
          window.SLOT_MACHINE.init({
            canvasId: 'renderCanvas',
          })
          clearInterval(waitCanvas)
        }
      }, 100)
      return () => { clearInterval(waitCanvas) }
    }
  }, [activeWeb3, isMetamaskConnected])

  const doSpin = () => {
    SLOT_MACHINE.spin()
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

  const [betAmount, setBetAmount] = useState(1)
  const [lineCount, setLineCount] = useState(1)
  useEffect(() => {
    console.log('>>> lineCount', lineCount, slotMachine, slotMachine ? slotMachine.isInited() : false)
    if (slotMachine && slotMachine.isInited()) {
      slotMachine.render_reel()
      for (let line = 0; line < lineCount; line++ ) {
        console.log('>>> render win line', line)
        slotMachine.render_winLine(line)
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
        <>
          <div>Slot machine</div>
          <canvas id="renderCanvas"></canvas>
          <Script strategy="lazyOnload" src="/_MYAPP/vendor/slots.js"></Script>
          <div>
            <label>Lines:</label>
            <input type="number" min="1" max="20" value={lineCount} onChange={(e) => { setLineCount(e.target.value) }} />
          </div>
          <div>
            <label>Bet:</label>
            <input type="number" min="1" max="100" value={betAmount} onChange={(e) => { setBetAmount(e.target.value) }} />
          </div>
          <div>
            <button className={`${styles.mainButton} primaryButton`} onClick={doSpin}>Spin</button>
          </div>
          <div>
            <button onClick={doStop}>Stop</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Slots;
