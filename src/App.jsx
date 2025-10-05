import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ManualEntry from './components/ManualEntry';
import ResultsTable from './components/ResultsTable';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, exoplanets: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('is_exoplanet');

      if (!error && data) {
        const total = data.length;
        const exoplanets = data.filter(p => p.is_exoplanet).length;
        setStats({ total, exoplanets });
      }
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const handlePrediction = async (data) => {
    setLoading(true);
    setError(null);

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

      if (result.error) {
        throw new Error(result.error);
      }

      setResults(result.predictions);

      await savePredictions(result.predictions, data);
      await loadStats();

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error processing prediction. Please ensure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const savePredictions = async (predictions, inputData) => {
    try {
      const records = predictions.map((pred, idx) => ({
        is_exoplanet: pred.isExoplanet,
        confidence: pred.confidence,
        flux_data: inputData[idx] ? inputData[idx].slice(0, 100) : [],
        created_at: new Date().toISOString()
      }));

      await supabase.from('predictions').insert(records);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <div className="app">
      <div className="particles-overlay"></div>

      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="mission-badge">NASA EXOPLANET DETECTION</div>
            <h1 className="title">
              <span className="title-line">Exoplanet</span>
              <span className="title-line">Classifier</span>
            </h1>
            <p className="subtitle">Neural network analysis of stellar light curves from Kepler mission data</p>

            {stats.total > 0 && (
              <div className="stats-bar">
                <div className="stat-item">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total Analyzed</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-value">{stats.exoplanets}</span>
                  <span className="stat-label">Exoplanets Detected</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className="tab-icon">📊</span>
            Upload CSV
          </button>
          <button
            className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <span className="tab-icon">✏️</span>
            Manual Entry
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

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
          <div className="footer-content">
            <div className="footer-section">
              <p className="footer-title">Mission Control</p>
              <p>Powered by TensorFlow Neural Network</p>
            </div>
            <div className="footer-section">
              <p className="footer-title">Data Source</p>
              <p>Kepler Space Telescope Archive</p>
            </div>
            <div className="footer-section">
              <p className="footer-title">Status</p>
              <p className="status-online">● ONLINE</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
