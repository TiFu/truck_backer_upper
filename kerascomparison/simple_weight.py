from keras.models import Sequential
from keras.layers import Dense, Activation
from keras import optimizers
import numpy as np
import keras 
init = keras.initializers.RandomUniform(minval=-0.05, maxval=0.05, seed=None)
model = Sequential()
model.add(Dense(2, input_dim = 3, activation="tanh", kernel_initializer=init, bias_initializer=init))
model.add(Dense(3))
sgd = optimizers.SGD(lr=0.01)
model.compile(loss="mean_squared_error", optimizer=sgd)

print(model.get_weights())