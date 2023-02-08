import { useEffect, useState } from "react"
import styles from "../styles/Home.module.css"

export default function DesignNumberInput(options) {
  const {
    value,
    onChange,
    min,
    max
  } = options

  const [ inValue, setInValue ] = useState(value)
  
  const minusValue = () => {
    setInValue((prev) => {
      return (prev <= min) ? min : prev - 1
    })
  }
  const plusValue = () => {
    setInValue((prev) => {
      return (prev >= max) ? max : prev + 1
    })
  }
  useEffect(() => {
    onChange(inValue)
  }, [ inValue ])
  
  return (
    <>
      <style jsx>
      {`
        DIV.designNumberInputHolder {
          display: flex;
        }
        
        DIV.designNumberInputHolder INPUT {
          font-size: 10pt;
          width: 48px;
          height: 24px;
          text-align: center;
          font-weight: bold;
          outline: none;
        }
        DIV.designNumberInputHolder INPUT::-webkit-outer-spin-button,
        DIV.designNumberInputHolder INPUT::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        DIV.designNumberInputHolder INPUT {
          -moz-appearance: textfield;
        }
        DIV.designNumberInputHolder .numberMinus {
          width: auto;
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
          height: 24px;
          min-width: auto;
          padding-left: 10px;
        }
        DIV.designNumberInputHolder .numberPlus {
          width: auto;
          border-top-left-radius: 0px;
          border-bottom-left-radius: 0px;
          height: 24px;
          min-width: auto;
          padding-right: 10px;
        }
      `}
      </style>
      <div className="designNumberInputHolder">
        <button disabled={inValue <= min} className={`${styles.mainButton} numberMinus`} onClick={minusValue}>-</button>
        <input type="number" min={min} max={max} value={inValue} onChange={(e) => { setInValue(e.target.value) }} />
        <button disabled={inValue >= max} className={`${styles.mainButton} numberPlus`} onClick={plusValue}>+</button>
      </div>
    </>
  )
}