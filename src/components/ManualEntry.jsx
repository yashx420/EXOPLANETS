import React, { useState } from 'react';
import './ManualEntry.css';

function ManualEntry({ onPredict, loading }) {
  const [textInput, setTextInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!textInput.trim()) {
      alert('Please enter flux values');
      return;
    }

    const lines = textInput.trim().split('\n');
    const dataArray = lines.map(line => {
      const values = line.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
      return values;
    }).filter(row => row.length > 0);

    if (dataArray.length === 0) {
      alert('No valid numeric data found');
      return;
    }

    onPredict(dataArray);
  };

  return (
    <div className="manual-entry">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="flux-input" className="input-label">
            Enter Light Curve Flux Values
          </label>
          <textarea
            id="flux-input"
            className="flux-textarea"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter comma-separated flux values, one candidate per line:&#10;&#10;Example:&#10;1.5, 2.3, 1.8, 2.1, 1.9, 2.4, ...&#10;1.2, 1.4, 1.3, 1.5, 1.1, 1.6, ..."
            rows={12}
          />
          <div className="input-hint">
            Each line represents one exoplanet candidate. Values should be comma-separated flux measurements from light curve data (typically 3000+ values per candidate).
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !textInput.trim()}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Analyzing Light Curves...</span>
            </>
          ) : (
            'Classify Exoplanets'
          )}
        </button>
      </form>
    </div>
  );
}

export default ManualEntry;
