from keras.models import Sequential
from keras.layers import Dense, Activation
from keras import optimizers
import numpy as np
import keras 
init = keras.initializers.RandomUniform(minval=-0.05, maxval=0.05, seed=None)
model = Sequential()
model.add(Dense(1, input_dim = 2, activation="tanh", kernel_initializer=init, bias_initializer=init))
sgd = optimizers.SGD(lr=0.01)
rmsprop = optimizers.rmsprop(lr=0.001, rho=0.9, epsilon=1e-8);

model.compile(loss="mean_squared_error", optimizer=rmsprop)
print(model.get_weights());
weights = [np.array([[ 0.02334204], [0.0045457]], dtype='float32'), np.array([-0.00419247], dtype='float32')]
model.set_weights(weights)
print("Predict: ");
prediction = model.predict(np.array([[1,1]]))
print(prediction)

model.fit(np.array([[1,1]]), np.array([[2]]), epochs=1, batch_size=1)
np.set_printoptions(suppress=True)
diff = np.array(model.get_weights()) - np.array(weights);
betweenWeights = model.get_weights();
print(diff)
#print(len(weights))
print(diff.shape)

print("Predict: ");
prediction = model.predict(np.array([[1,1]]))
print(prediction)

model.fit(np.array([[1,1]]), np.array([[2]]), epochs=1, batch_size=1)
diff = np.array(np.array(model.get_weights()) - np.array(betweenWeights));
print(diff)

#print(model.get_updates_for(np.array([[1,1,1,1,1,1,1]])))

