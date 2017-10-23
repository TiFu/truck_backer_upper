from keras.models import load_model

model = load_model("./model2")

for layer in model.layers:
    weights = layer.get_weights()
    print(weights)
    print("")