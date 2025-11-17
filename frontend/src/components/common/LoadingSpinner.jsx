import React from 'react';

/**
 * A reusable loading spinner component.
 * @param {object} props
 * @param {boolean} [props.fullPage=false] - If true, centers the spinner on the full page.
 */
function LoadingSpinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-border spinner-border-sm" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
