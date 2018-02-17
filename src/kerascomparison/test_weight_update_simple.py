from keras.models import Sequential
from keras.layers import Dense, Activation
from keras import optimizers
import numpy as np
np.set_printoptions(suppress=True)
import keras 
from convert_keras_weights import convert, printConverted
init = keras.initializers.RandomUniform(minval=-0.05, maxval=0.05, seed=None)
model = Sequential()
model.add(Dense(2, input_dim = 2, activation="tanh", kernel_initializer=init, bias_initializer=init))
model.add(Dense(2, activation="tanh", kernel_initializer=init, bias_initializer=init))
sgd = optimizers.SGD(lr=0.05)
rmsprop = optimizers.rmsprop(lr=0.001, rho=0.9, epsilon=1e-8);

model.compile(loss="mean_squared_error", optimizer=sgd)
print(model.get_weights());
weights = [np.array([[ 0.01649947, -0.01938837],
       [-0.00206941,  0.01206242]], dtype="float32"), np.array([-0.03818224, -0.0170786 ], dtype="float32"), np.array([[ 0.00995567, -0.01083057],
       [-0.04039849,  0.03846506]], dtype="float32"), np.array([-0.01617046, -0.02988303], dtype="float32")]

model.set_weights(weights)

prediction = model.predict(np.array([[1,1]]))
print("Predicted: " + str(prediction))

model.fit(np.array([[1,1], [2, 2], [3, 3]]), np.array([[0.5, 0.25], [0.75, 0.375], [1, 0.5]]), epochs=1, batch_size=3)
np.set_printoptions(suppress=True)
modelWeights = model.get_weights()
diff = []
for i in range(len(modelWeights)):
    diff.append(modelWeights[i] - weights[i]);
betweenWeights = model.get_weights();
printConverted(convert(diff))
#print(len(weights))

prediction = model.predict(np.array([[1,1]]))
print("Predicted: " + str(prediction))

#model.fit(np.array([[2,2]]), np.array([[0.75, 0.375]]), epochs=1, batch_size=1)
#modelWeights = model.get_weights()
#diff = []
#for i in range(len(modelWeights)):
#    diff.append(modelWeights[i] - betweenWeights[i]);
#printConverted(convert(diff))



#prediction = model.predict(np.array([[1,1]]))
#print("Predicted: " + str(prediction))
#print(model.get_updates_for(np.array([[1,1,1,1,1,1,1]])))

