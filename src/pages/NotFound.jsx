import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-description">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-button primary">
            Go Home
          </Link>
          <button 
            onClick={handleGoBack}
            className="not-found-button secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound