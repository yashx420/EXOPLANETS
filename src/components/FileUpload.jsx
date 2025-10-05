import React, { useState } from 'react';
import Papa from 'papaparse';
import './FileUpload.css';

function FileUpload({ onPredict, loading }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file first');
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const dataArray = results.data
          .filter(row => Object.values(row).some(val => val !== null && val !== ''))
          .map(row => {
            const values = Object.values(row).filter(val => val !== null && val !== '');
            return values;
          });

        if (dataArray.length === 0) {
          alert('No valid data found in CSV file');
          return;
        }

        onPredict(dataArray);
      },
      error: (error) => {
        alert('Error parsing CSV file: ' + error.message);
      }
    });
  };

  return (
    <div className="file-upload">
      <form onSubmit={handleSubmit}>
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            accept=".csv"
            onChange={handleChange}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="upload-text">
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </span>
            <span className="upload-hint">
              CSV should contain light curve flux values (each row is one candidate)
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !file}
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

export default FileUpload;
