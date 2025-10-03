const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/predict', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: 'Invalid data format. Expected array of flux values.'
      });
    }

    const predictions = data.map((fluxValues, index) => {
      if (!Array.isArray(fluxValues) || fluxValues.length === 0) {
        return {
          isExoplanet: false,
          confidence: 0.0
        };
      }

      const mean = fluxValues.reduce((a, b) => a + b, 0) / fluxValues.length;
      const variance = fluxValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / fluxValues.length;
      const stdDev = Math.sqrt(variance);

      const minVal = Math.min(...fluxValues);
      const maxVal = Math.max(...fluxValues);
      const range = maxVal - minVal;

      const dips = fluxValues.filter((val, i) => {
        if (i === 0 || i === fluxValues.length - 1) return false;
        return val < fluxValues[i - 1] && val < fluxValues[i + 1] && (mean - val) > stdDev * 0.5;
      }).length;

      let score = 0;

      if (stdDev > 0.01) score += 0.2;
      if (range > 0.05) score += 0.2;
      if (dips >= 3) score += 0.3;
      if (variance > 0.001) score += 0.15;

      const negativeFluxCount = fluxValues.filter(v => v < mean - stdDev).length;
      if (negativeFluxCount > fluxValues.length * 0.05) {
        score += 0.15;
      }

      const confidence = Math.min(Math.max(score + (Math.random() * 0.1 - 0.05), 0), 1);
      const isExoplanet = confidence > 0.5;

      return {
        isExoplanet,
        confidence: parseFloat(confidence.toFixed(4))
      };
    });

    res.json({ predictions });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      details: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Exoplanet prediction service is running' });
});

app.listen(PORT, () => {
  console.log(`Prediction API server running on http://localhost:${PORT}`);
  console.log(`\nNOTE: This is a simplified prediction service for demonstration.`);
  console.log(`To use the actual trained model (exoplanet_model.h5), you would need:`);
  console.log(`  1. Python environment with TensorFlow, NumPy, SciPy, and scikit-learn`);
  console.log(`  2. The preprocessing pipeline from project_main.py`);
  console.log(`  3. Integration with the Keras model file\n`);
});
