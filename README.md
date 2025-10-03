# Exoplanet Classifier Web Interface

A web application for classifying exoplanet candidates based on light curve flux data using a trained neural network model.

## Features

- **CSV File Upload**: Upload CSV files containing light curve flux measurements
- **Manual Data Entry**: Manually enter comma-separated flux values
- **Real-time Classification**: Get instant predictions on whether candidates are exoplanets
- **Results Dashboard**: View detailed classification results with confidence scores
- **Clean UI**: Modern, responsive interface with dark theme

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

You need to run two servers:

1. **Start the API server** (in one terminal):
```bash
npm run server
```
This starts the prediction API on `http://localhost:3001`

2. **Start the web application** (in another terminal):
```bash
npm run dev
```
This starts the Vite dev server (usually on `http://localhost:5173`)

3. Open your browser and navigate to the URL shown by Vite (typically `http://localhost:5173`)

## Usage

### Upload CSV File

1. Click the "Upload CSV" tab
2. Drag and drop a CSV file or click to browse
3. CSV should contain flux values (each row is one exoplanet candidate)
4. Click "Classify Exoplanets" to get predictions

Sample CSV format:
```csv
flux_1,flux_2,flux_3,flux_4,flux_5,...
1.523,1.487,1.512,1.498,1.445,...
1.234,1.245,1.238,1.241,1.239,...
```

A sample CSV file (`sample_exoplanets.csv`) is included in the project root.

### Manual Entry

1. Click the "Manual Entry" tab
2. Enter flux values as comma-separated numbers
3. Each line represents one exoplanet candidate
4. Click "Classify Exoplanets" to get predictions

Example:
```
1.5, 2.3, 1.8, 2.1, 1.9, 2.4, 1.7, 2.2, 1.6, 2.5
1.2, 1.4, 1.3, 1.5, 1.1, 1.6, 1.4, 1.3, 1.2, 1.5
```

## Understanding Results

The results table shows:
- **Candidate #**: Sequential number of each candidate
- **Classification**: Whether it's classified as an "Exoplanet" or "Not an Exoplanet"
- **Confidence**: Prediction confidence score (0-100%)
- **Status**: Visual indicator (Confirmed/Rejected)

Summary cards display:
- Total number of candidates analyzed
- Number of confirmed exoplanets
- Number of rejected candidates

## Technical Details

### Model Information

This application uses a Convolutional Neural Network (CNN) model trained on Kepler Space Telescope data. The model architecture includes:
- 1D Convolutional layers with batch normalization
- Max pooling layers
- Dense layers with dropout
- Binary classification output (exoplanet or not)

### Data Processing Pipeline

The system preprocesses light curve data through:
1. Normalization of flux values
2. Gaussian filtering (sigma = 7.0)
3. Fast Fourier Transform (FFT)
4. Feature extraction from frequency domain

**Note**: The current implementation uses a simplified prediction algorithm for demonstration purposes. To use the actual trained model (`exoplanet_model.h5`), you would need:
- Python environment with TensorFlow, NumPy, SciPy, and scikit-learn
- Full preprocessing pipeline from `project_main.py`
- Integration layer between Node.js and Python

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx    # CSV file upload component
│   │   ├── ManualEntry.jsx   # Manual data entry component
│   │   └── ResultsTable.jsx  # Results display component
│   ├── App.jsx               # Main application component
│   ├── App.css              # Application styles
│   └── main.jsx             # Entry point
├── server.js                # Express API server
├── models.py               # Neural network model definitions
├── project_main.py         # Model training script
├── exoplanet_model.h5     # Trained Keras model
└── sample_exoplanets.csv  # Sample data file
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## License

ISC
