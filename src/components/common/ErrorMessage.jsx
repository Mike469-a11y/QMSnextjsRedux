import React from 'react'

const ErrorMessage = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showRetry = true 
}) => {
  const errorMessage = error?.message || 'An unexpected error occurred'

  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{errorMessage}</p>
      {showRetry && onRetry && (
        <button 
          className="error-retry-button"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage