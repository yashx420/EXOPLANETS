import React from 'react';
import './ResultsTable.css';

function ResultsTable({ results }) {
  return (
    <div className="results-section">
      <h2 className="results-title">Classification Results</h2>
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Candidate #</th>
              <th>Classification</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} className={result.isExoplanet ? 'exoplanet-row' : ''}>
                <td>{index + 1}</td>
                <td>
                  <span className={`classification-badge ${result.isExoplanet ? 'positive' : 'negative'}`}>
                    {result.isExoplanet ? 'Exoplanet' : 'Not an Exoplanet'}
                  </span>
                </td>
                <td>{(result.confidence * 100).toFixed(2)}%</td>
                <td>
                  <div className="status-indicator">
                    {result.isExoplanet ? (
                      <>
                        <svg className="icon success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <svg className="icon neutral" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>Rejected</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="results-summary">
        <div className="summary-card">
          <div className="summary-label">Total Candidates</div>
          <div className="summary-value">{results.length}</div>
        </div>
        <div className="summary-card success">
          <div className="summary-label">Confirmed Exoplanets</div>
          <div className="summary-value">
            {results.filter(r => r.isExoplanet).length}
          </div>
        </div>
        <div className="summary-card neutral">
          <div className="summary-label">Rejected Candidates</div>
          <div className="summary-value">
            {results.filter(r => !r.isExoplanet).length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsTable;
