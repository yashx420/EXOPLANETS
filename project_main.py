import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import signal
from scipy.ndimage import gaussian_filter   # ✅ fixed deprecated import
from scipy.fftpack import fft
import scipy
import seaborn as sns
import models as m   # your custom file

import sklearn.linear_model as lm
import tensorflow as tf
import sklearn.svm as svm

from tensorflow.keras import models, layers
from tensorflow.keras.preprocessing import sequence
from tensorflow.keras.utils import plot_model   # ✅ correct import for model plotting

import sklearn.preprocessing as pproc
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.preprocessing import normalize

from imblearn.over_sampling import RandomOverSampler



# import the dataset
data_train = pd.read_csv('exoTrain.csv')
data_test  = pd.read_csv('exoTest.csv')




# permute the dataset
data_train = np.random.permutation(np.asarray(data_train))
data_test = np.random.permutation(np.asarray(data_test))



# get the Label column and delete the class column and rescale
y1 = data_train[:, 0]
y2 = data_test[:, 0]

# if already 0/1, this step is unnecessary – but keeping for safety
y_train = (y1 - min(y1)) / (max(y1) - min(y1))
y_test = (y2 - min(y2)) / (max(y2) - min(y2))

data_train = np.delete(data_train, 1, 1)
data_test = np.delete(data_test, 1, 1)



# print the light curve
time = np.arange(len(data_train[0])) * (36 / 60)  # time in hours

plt.figure(figsize=(20, 5))
plt.title('Flux of star 10 with confirmed planet')
plt.ylabel('Flux')
plt.xlabel('Hours')
plt.plot(time, data_train[10])     # change the index to plot what you want



# normalized data
data_train_norm = normalize(data_train)
data_test_norm = normalize(data_test)


# function to apply gaussian filter to all data
def gauss_filter(dataset, sigma):
    dts = []
    for x in range(dataset.shape[0]):
        dts.append(gaussian_filter(dataset[x], sigma))
    return np.asarray(dts)


# apply the gaussian filter to all rows
data_train_gaussian = gauss_filter(data_train_norm, 7.0)
data_test_gaussian = gauss_filter(data_test_norm, 7.0)



# FFT of the data
frequency = np.arange(len(data_train[0])) * (1 / (36.0 * 60.0))

data_train_fft1 = scipy.fft.fft2(data_train_norm, axes=1)
data_test_fft1 = scipy.fft.fft2(data_test_norm, axes=1)

data_train_fft = np.abs(data_train_fft1)   # magnitude
data_test_fft = np.abs(data_test_fft1)



# sequence length
len_seq = len(data_train_fft[0])


# oversampling (✅ updated to fit_resample)
rm = RandomOverSampler(sampling_strategy=0.5)
data_train_ovs, y_train_ovs = rm.fit_resample(data_train_fft, y_train)


# recap dataset after oversampling
print("After oversampling, counts of label '1': {}".format(sum(y_train_ovs == 1)))
print("After oversampling, counts of label '0': {}".format(sum(y_train_ovs == 0)))


# reshape data for the neural network
data_train_ovs_nn = data_train_ovs.reshape((data_train_ovs.shape[0], data_train_ovs.shape[1], 1))
data_test_fft_nn = data_test_fft.reshape((data_test_fft.shape[0], data_test_fft.shape[1], 1))


# create FCN model and run it
model = m.FCN_model(len_seq)

model.compile(loss='binary_crossentropy',
              optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
              metrics=['accuracy'])

print(model.summary())

history = model.fit(data_train_ovs_nn, y_train_ovs,
                    epochs=2,
                    batch_size=10,
                    validation_data=(data_test_fft_nn, y_test))


# visualize model (optional)
# plot_model(model, to_file="model.png", show_shapes=True, show_layer_names=True)


# training accuracy plot
acc = history.history['accuracy']
epochs = range(1, len(acc) + 1)
plt.plot(epochs, acc, 'b', label='accuracy_train')
plt.title('accuracy')
plt.xlabel('epochs')
plt.ylabel('accuracy')
plt.legend()
plt.grid()
plt.show()


# training loss plot
loss = history.history['loss']
plt.plot(epochs, loss, 'b', label='loss_train')
plt.title('loss')
plt.xlabel('epochs')
plt.ylabel('loss')
plt.legend()
plt.grid()
plt.show()


# predict test set
y_test_pred = model.predict(data_test_fft_nn)
y_test_pred = (y_test_pred > 0.5)

accuracy = accuracy_score(y_test, y_test_pred)
print("accuracy : ", accuracy)

print(classification_report(y_test, y_test_pred,
      target_names=["NO exoplanet confirmed", "YES exoplanet confirmed"]))

conf_matrix = confusion_matrix(y_test.astype(int), y_test_pred.astype(int))
sns.heatmap(conf_matrix, annot=True, cmap='Blues')

# Save the Keras model
model.save("exoplanet_model.h5")
