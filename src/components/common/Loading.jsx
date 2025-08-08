import React from 'react'

const Loading = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      <p className="loading-text">{text}</p>
    </div>
  )
}

export default Loading