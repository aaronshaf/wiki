import React from 'react'
import './Spinner.css'

export default class Spinner extends React.Component {
  render() {
    return (
      <svg className="spinner" width="32px" height="32px" viewBox="0 0 66 66">
        <circle
          className="path"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          cx={33}
          cy={33}
          r={30}
        />
      </svg>
    )
  }
}
