import numpy as np
from keras.models import load_model

model = load_model("./model4")
x = np.loadtxt("x")
xMean = x.mean(axis=0)
xStd =  x.std(axis=0)
x = (x - x.mean(axis=0)) / x.std(axis=0)
y = np.loadtxt("y")
#y = (y - y.mean(axis=0)) / y.std(axis=0)


input = np.array([[-0.43978661746099706, 2.43791632282507, 0, 0 , 0.003118879100984262]])
input = (input - xMean) / xStd
print(input)
pred = model.predict(input)
print("Prediction: " + str(pred * y.std(axis=0)+y.mean(axis=0)))
exit()
while True:
    var = raw_input("Please enter something: ")
    var = int(var)
    pred = model.predict(x[var:var+1])
    print("Prediction: " + str(pred * y.std(axis=0)+y.mean(axis=0)))
    print("Real: " + str(y[var]))