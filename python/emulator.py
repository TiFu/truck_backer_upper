import numpy as np
from matplotlib import pyplot as plt
from keras.utils import np_utils
import keras.callbacks as cb
from keras.models import Sequential
from keras.layers.core import Dense, Dropout, Activation
from keras.optimizers import RMSprop

x = np.loadtxt("x")
# normalize to mean 0 and stddev 1
x = (x - x.mean(axis=0)) / x.std(axis=0)
y = np.loadtxt("y")
y = (y - y.mean(axis=0)) / y.std(axis=0)
X_train = x[0:70000]
y_train = y[0:70000]
X_test = x[70000:80000]
y_test = y[70000:80000]
X_eval = x[80000:100000]
y_eval = y[80000:100000]

class LossHistory(cb.Callback):
    def on_train_begin(self, logs={}):
        self.losses = []

    def on_batch_end(self, batch, logs={}):
        batch_loss = logs.get('loss')
        self.losses.append(batch_loss)


model = Sequential()
model.add(Dense(45, input_dim=5))
model.add(Activation("tanh"))
model.add(Dense(4))
model.add(Activation("linear"))

model.compile(loss='mean_squared_error', optimizer='rmsprop')


history = LossHistory()


model.fit(X_train, y_train, nb_epoch=30, batch_size=256,
            callbacks=[history],
            validation_data=(X_test, y_test), verbose=2)

score = model.evaluate(X_eval, y_eval, batch_size = 16)

model.save("./model4")

print(score)

def plot_losses(losses):
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.plot(losses)
    ax.set_title('Loss per batch')
    plt.show()

plot_losses(history.losses)