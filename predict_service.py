import numpy as np
import tensorflow as tf
from scipy.ndimage import gaussian_filter
from sklearn.preprocessing import normalize
import scipy.fft
import json
import sys

def preprocess_data(raw_data):
    data = np.array(raw_data)

    if len(data.shape) == 1:
        data = data.reshape(1, -1)

    data_norm = normalize(data)

    data_gaussian = []
    for x in range(data_norm.shape[0]):
        data_gaussian.append(gaussian_filter(data_norm[x], 7.0))
    data_gaussian = np.array(data_gaussian)

    data_fft1 = scipy.fft.fft2(data_gaussian, axes=1)
    data_fft = np.abs(data_fft1)

    data_reshaped = data_fft.reshape((data_fft.shape[0], data_fft.shape[1], 1))

    return data_reshaped

def predict_exoplanets(model_path, data_array):
    try:
        model = tf.keras.models.load_model(model_path)

        processed_data = preprocess_data(data_array)

        predictions = model.predict(processed_data)

        results = []
        for i, pred in enumerate(predictions):
            confidence = float(pred[0])
            is_exoplanet = confidence > 0.5
            results.append({
                'isExoplanet': is_exoplanet,
                'confidence': confidence
            })

        return results
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input data provided'}))
        sys.exit(1)

    try:
        input_data = json.loads(sys.argv[1])
        model_path = 'exoplanet_model.h5'

        results = predict_exoplanets(model_path, input_data)
        print(json.dumps({'predictions': results}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
