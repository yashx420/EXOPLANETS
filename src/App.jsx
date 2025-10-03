import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ManualEntry from './components/ManualEntry';
import ResultsTable from './components/ResultsTable';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const handlePrediction = async (data) => {
    setLoading(true);
    try {
      const apiUrl = 'http://localhost:3001/api/predict';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      setResults(result.predictions);
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing prediction. Please make sure the API server is running (npm run server).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">Exoplanet Classifier</h1>
          <p className="subtitle">Analyze light curve data to identify exoplanet candidates</p>
        </div>
      </header>

      <main className="main-content container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload CSV
          </button>
          <button
            className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry
          </button>
        </div>

        <div className="content-area">
          {activeTab === 'upload' ? (
            <FileUpload onPredict={handlePrediction} loading={loading} />
          ) : (
            <ManualEntry onPredict={handlePrediction} loading={loading} />
          )}
        </div>

        {results.length > 0 && (
          <ResultsTable results={results} />
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>Powered by Neural Network Model trained on Kepler Space Telescope data</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
