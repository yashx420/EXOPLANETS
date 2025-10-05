const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MODEL_PATH = path.join(__dirname, 'exoplanet_model.h5');
const PYTHON_SCRIPT = path.join(__dirname, 'predict_service.py');
const TIMEOUT_MS = 60000;

function validateFluxData(data) {
  if (!data || !Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array' };
  }

  if (data.length === 0) {
    return { valid: false, error: 'Data array cannot be empty' };
  }

  if (data.length > 100) {
    return { valid: false, error: 'Maximum 100 candidates per request' };
  }

  for (let i = 0; i < data.length; i++) {
    if (!Array.isArray(data[i])) {
      return { valid: false, error: `Row ${i + 1} must be an array` };
    }
    if (data[i].length < 100) {
      return { valid: false, error: `Row ${i + 1} has insufficient data points (minimum 100 required)` };
    }
    if (!data[i].every(v => typeof v === 'number' && !isNaN(v))) {
      return { valid: false, error: `Row ${i + 1} contains invalid numeric values` };
    }
  }

  return { valid: true };
}

async function runPythonPrediction(data, timeout = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const inputData = JSON.stringify(data);
    const pythonProcess = spawn('python3', [PYTHON_SCRIPT, inputData]);

    let outputData = '';
    let errorData = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      pythonProcess.kill();
      reject(new Error('Prediction timeout exceeded'));
    }, timeout);

    pythonProcess.stdout.on('data', (chunk) => {
      outputData += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      errorData += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) return;

      if (code !== 0) {
        console.error('Python process error:', errorData);
        return reject(new Error(errorData || `Python process exited with code ${code}`));
      }

      try {
        const result = JSON.parse(outputData);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        reject(new Error('Failed to parse prediction output'));
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

app.post('/api/predict', async (req, res) => {
  const startTime = Date.now();

  try {
    const { data } = req.body;

    const validation = validateFluxData(data);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        code: 'INVALID_INPUT'
      });
    }

    if (!fs.existsSync(MODEL_PATH)) {
      return res.status(503).json({
        error: 'Model file not found. Please ensure exoplanet_model.h5 exists.',
        code: 'MODEL_NOT_FOUND'
      });
    }

    if (!fs.existsSync(PYTHON_SCRIPT)) {
      return res.status(503).json({
        error: 'Prediction service not available',
        code: 'SERVICE_NOT_FOUND'
      });
    }

    console.log(`[${new Date().toISOString()}] Processing ${data.length} candidates...`);

    const result = await runPythonPrediction(data);

    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Completed in ${processingTime}ms`);

    res.json({
      ...result,
      metadata: {
        processingTime,
        candidateCount: data.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${processingTime}ms:`, error.message);

    res.status(500).json({
      error: error.message || 'Prediction failed',
      code: 'PREDICTION_ERROR',
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.get('/api/health', (req, res) => {
  const checks = {
    server: 'ok',
    model: fs.existsSync(MODEL_PATH) ? 'ok' : 'missing',
    script: fs.existsSync(PYTHON_SCRIPT) ? 'ok' : 'missing',
    timestamp: new Date().toISOString()
  };

  const allOk = Object.values(checks).every(v => v === 'ok' || typeof v === 'string');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    checks
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    maxCandidatesPerRequest: 100,
    minDataPointsPerCandidate: 100,
    timeoutMs: TIMEOUT_MS,
    modelVersion: '1.0.0',
    modelType: 'TensorFlow/Keras CNN'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  NASA Exoplanet Detection System - Backend Server');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`  📈 Statistics: http://localhost:${PORT}/api/stats\n`);
  console.log('  Model: exoplanet_model.h5');
  console.log('  Engine: TensorFlow Neural Network\n');
  console.log('════════════════════════════════════════════════════════\n');
});
