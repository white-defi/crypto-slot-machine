import styles from "../../styles/Home.module.css"
import { useEffect, useState } from "react"
import fetchTokenInfo from "../../helpers/fetchTokenInfo"



export default function ERC20Info(options) => {
  const {
    title,
    value,
    onChange,
    placeholder,
    onSetIsTokenFetched,
    tokenInfo,
    onSetTokenInfo
  } = options
  
  const [ newAddress, setNewAddress ] = useState(value)
  const [ isTokenFetching, setIsTokenFetching ] = useState(false)
  const [ isTokenFetched, setIsTokenFetched ] = useState(tokenInfo && tokenInfo.address)
  
  const onChangeAddress = (addr) => {
    setNewAddress(addr)
    onChange(add)
    onSetTokenInfo({})
    onSetIsTokenFetched(false)
  }
  return (
    <>
      {adminFormRow({
        label: `Bank token`,
        type: `address`,
        value: newBankTokenAddress,
        onChange: setNewBankTokenAddress,
        placeholder: `Ender address of Bank ERC20 token`,
        buttons: (
          <button disabled={isBankTokenFetching} onClick={doBankFetchTokenInfo}>
            {isTokenFetching ? `Fetching` : `Fetch token info`}
          </button>
        )
      })}
      {isTokenFetched && newTokenInfo && newTokenInfo.address && (
        <div className={styles.infoTable}>
          <h3>Token info</h3>
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
      )}
    </>
  )
}