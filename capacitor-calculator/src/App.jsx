import { useState } from 'react'
import './App.css'

const MAX_DIGITS = 15

function compute(a, b, operator) {
  switch (operator) {
    case '+':
      return a + b
    case '−':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? null : a / b
    default:
      return b
  }
}

// Avoids floating point artifacts like 0.1 + 0.2 = 0.30000000000000004
function cleanNumber(num) {
  return parseFloat(num.toPrecision(12))
}

function formatNumber(value) {
  if (value === 'Error') return value

  const [intPart, decPart] = String(value).split('.')
  const isNegative = intPart.startsWith('-')
  const digits = isNegative ? intPart.slice(1) : intPart
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = isNegative ? '-' : ''

  return decPart !== undefined ? `${sign}${withCommas}.${decPart}` : `${sign}${withCommas}`
}

function digitCount(value) {
  return value.replace(/[^0-9]/g, '').length
}

const initialState = {
  display: '0',
  prevValue: null,
  operator: null,
  expression: '',
  waitingForNewOperand: false,
  justEvaluated: false,
  isError: false,
}

function App() {
  const [state, setState] = useState(initialState)
  const { display, expression } = state

  const clearAll = () => setState(initialState)

  const inputDigit = (d) => {
    setState((s) => {
      if (s.isError) return { ...initialState, display: d }

      if (s.waitingForNewOperand) {
        return {
          ...s,
          display: d,
          waitingForNewOperand: false,
          prevValue: s.justEvaluated ? null : s.prevValue,
          operator: s.justEvaluated ? null : s.operator,
          expression: s.justEvaluated ? '' : s.expression,
          justEvaluated: false,
        }
      }

      if (digitCount(s.display) >= MAX_DIGITS) return s

      const nextDisplay = s.display === '0' ? d : s.display + d
      return { ...s, display: nextDisplay }
    })
  }

  const inputDoubleZero = () => {
    setState((s) => {
      if (s.isError) return { ...initialState, display: '0' }

      if (s.waitingForNewOperand) {
        return {
          ...s,
          display: '0',
          waitingForNewOperand: false,
          prevValue: s.justEvaluated ? null : s.prevValue,
          operator: s.justEvaluated ? null : s.operator,
          expression: s.justEvaluated ? '' : s.expression,
          justEvaluated: false,
        }
      }

      if (s.display === '0' || digitCount(s.display) >= MAX_DIGITS - 1) return s
      return { ...s, display: s.display + '00' }
    })
  }

  const inputDecimal = () => {
    setState((s) => {
      if (s.isError) return { ...initialState, display: '0.' }

      if (s.waitingForNewOperand) {
        return {
          ...s,
          display: '0.',
          waitingForNewOperand: false,
          prevValue: s.justEvaluated ? null : s.prevValue,
          operator: s.justEvaluated ? null : s.operator,
          expression: s.justEvaluated ? '' : s.expression,
          justEvaluated: false,
        }
      }

      if (s.display.includes('.')) return s
      return { ...s, display: s.display + '.' }
    })
  }

  const chooseOperator = (op) => {
    setState((s) => {
      if (s.isError) return s

      const inputValue = parseFloat(s.display)

      if (s.prevValue !== null && s.operator && !s.waitingForNewOperand) {
        const result = compute(s.prevValue, inputValue, s.operator)
        if (result === null) {
          return { ...initialState, display: 'Error', isError: true }
        }
        const clean = cleanNumber(result)
        return {
          ...s,
          prevValue: clean,
          display: String(clean),
          operator: op,
          expression: `${formatNumber(clean)} ${op}`,
          waitingForNewOperand: true,
          justEvaluated: false,
        }
      }

      return {
        ...s,
        prevValue: inputValue,
        operator: op,
        expression: `${formatNumber(inputValue)} ${op}`,
        waitingForNewOperand: true,
        justEvaluated: false,
      }
    })
  }

  const inputPercent = () => {
    setState((s) => {
      if (s.isError) return s
      const value = cleanNumber(parseFloat(s.display) / 100)
      return { ...s, display: String(value) }
    })
  }

  const equals = () => {
    setState((s) => {
      if (s.isError || s.operator === null || s.prevValue === null) return s

      const inputValue = parseFloat(s.display)
      const result = compute(s.prevValue, inputValue, s.operator)

      if (result === null) {
        return { ...initialState, display: 'Error', isError: true }
      }

      const clean = cleanNumber(result)
      return {
        display: String(clean),
        prevValue: null,
        operator: null,
        expression: `${formatNumber(s.prevValue)} ${s.operator} ${formatNumber(inputValue)} =`,
        waitingForNewOperand: true,
        justEvaluated: true,
        isError: false,
      }
    })
  }

  const deleteLast = () => {
    setState((s) => {
      if (s.isError) return initialState
      if (s.waitingForNewOperand) return s

      if (s.display.length <= 1 || (s.display.length === 2 && s.display.startsWith('-'))) {
        return { ...s, display: '0' }
      }
      return { ...s, display: s.display.slice(0, -1) }
    })
  }

  const formattedDisplay = formatNumber(display)
  const fontSizeClass =
    formattedDisplay.length <= 9 ? 'font-xl' : formattedDisplay.length <= 12 ? 'font-lg' : formattedDisplay.length <= 16 ? 'font-md' : 'font-sm'

  return (
    <div className="calculator-page">
      <div className="calculator">
        <div className="display" aria-live="polite">
          <div className="expression">{expression || ' '}</div>
          <div className={`current ${fontSizeClass}`}>{formattedDisplay}</div>
        </div>

        <div className="keypad">
          <button type="button" className="key key-function" onClick={clearAll}>AC</button>
          <button type="button" className="key key-function" onClick={deleteLast}>DEL</button>
          <button type="button" className="key key-function" onClick={inputPercent}>%</button>
          <button type="button" className="key key-operator" onClick={() => chooseOperator('÷')}>÷</button>

          <button type="button" className="key key-number" onClick={() => inputDigit('7')}>7</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('8')}>8</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('9')}>9</button>
          <button type="button" className="key key-operator" onClick={() => chooseOperator('×')}>×</button>

          <button type="button" className="key key-number" onClick={() => inputDigit('4')}>4</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('5')}>5</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('6')}>6</button>
          <button type="button" className="key key-operator" onClick={() => chooseOperator('−')}>−</button>

          <button type="button" className="key key-number" onClick={() => inputDigit('1')}>1</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('2')}>2</button>
          <button type="button" className="key key-number" onClick={() => inputDigit('3')}>3</button>
          <button type="button" className="key key-operator" onClick={() => chooseOperator('+')}>+</button>

          <button type="button" className="key key-number" onClick={() => inputDigit('0')}>0</button>
          <button type="button" className="key key-number" onClick={inputDoubleZero}>00</button>
          <button type="button" className="key key-number" onClick={inputDecimal}>.</button>
          <button type="button" className="key key-equals" onClick={equals}>=</button>
        </div>
      </div>
    </div>
  )
}

export default App
