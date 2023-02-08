import { useState } from "react"
import { switchOrAddChain, getCurrentChainId } from "../helpers/setupWeb3"
import { CHAIN_INFO } from "../helpers/constants"

export default function SwitchNetworkAndCall(options) {
  const {
    children,
    disabled,
    onClick,
    chainId,
    action
  } = {
    disabled: false,
    chainId: 1,
    action: `Save`,
    onClick: () => {},
    ...options
  }

  const [ isSwitching, setIsSwitching ] = useState(false)
  const currentChainId = getCurrentChainId()
  const needChainInfo = CHAIN_INFO(chainId)

  const switchOrClick = () => {
    if (`${currentChainId}` !== `${chainId}`) {
      setIsSwitching(true)
      switchOrAddChain(chainId).then((isSwitched) => {
        setIsSwitching(false)
        if (isSwitched) {
          onClick()
        }
      }).catch ((err) => {
        setIsSwitching(false)
      })
    } else {
      onClick()
    }
  }
  return (
    <button disabled={disabled || isSwitching} onClick={switchOrClick}>
      {(`${currentChainId}` !== `${chainId}`) ? (
        <>
          {isSwitching ? (
            <>{`Switching to ${needChainInfo.chainName} (${chainId})...`}</>
          ) : (
            <>{`Switch to ${needChainInfo.chainName} (${chainId}) for ${action}`}</>
          )}
        </>
      ) : (
        <>
          {children}
        </>
      )}
    </button>
  )
}