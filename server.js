const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

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

    const pythonScript = path.join(__dirname, 'predict_service.py');
    const inputData = JSON.stringify(data);

    const pythonProcess = spawn('python3', [pythonScript, inputData]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', errorData);
        return res.status(500).json({
          error: 'Model prediction failed',
          details: errorData || 'Python process exited with non-zero code',
          useFallback: true
        });
      }

      try {
        const result = JSON.parse(outputData);
        if (result.error) {
          return res.status(500).json({
            error: result.error,
            useFallback: true
          });
        }
        res.json(result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({
          error: 'Failed to parse model output',
          details: parseError.message,
          useFallback: true
        });
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      details: error.message,
      useFallback: true
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Exoplanet prediction service is running' });
});

app.listen(PORT, () => {
  console.log(`Prediction API server running on http://localhost:${PORT}`);
  console.log(`Using TensorFlow model: exoplanet_model.h5`);
  console.log(`\nRequirements:`);
  console.log(`  - Python 3.x with TensorFlow, NumPy, SciPy, scikit-learn installed`);
  console.log(`  - exoplanet_model.h5 file in project root\n`);
});
