
# Keras
# Element for each layer
    # [0] for each input one value per neuron (so 7 times an array with 45)
    # [1] Bias for each neuron
# What I need
# Element for each layer
    # for each neuron one array with 7 entries
import numpy as np
"""weights = [[[-0.00376929,  0.03486726],
       [ 0.01342994,  0.0231015 ],
       [ 0.01735607, -0.03529174]], [ 0.00200979, -0.00523797],[[ 0.56883514,  0.89121616,  1.03019452],
       [ 0.86656129,  0.84186172, -0.60320234]],[ 0.,  0.,  0.]]
"""
weights =  [np.array([[ 0.01649947, -0.01938837],
       [-0.00206941,  0.01206242]], dtype="float32"), np.array([-0.03818224, -0.0170786 ], dtype="float32"), np.array([[ 0.00995567, -0.01083057],
       [-0.04039849,  0.03846506]], dtype="float32"), np.array([-0.01617046, -0.02988303], dtype="float32")]


def convert(kerasWeights):
    layers = []
    bias = False
    for layer in kerasWeights:
        if not bias:
            units = []
            for i in range(len(layer)):
                unitWeights = layer[i]
                if len(unitWeights) > len(units):
                    for j in range(len(unitWeights)):
                        units.append([]);
                for j in range(len(unitWeights)):
                    units[j].append(unitWeights[j])
        else:
            for j in range(len(layer)):
                units[j].append(layer[j])
        if bias:
            layers.append(units)
        bias = not bias
    return layers

def printConverted(layers):
    import json
    from json import encoder
    def pretty_floats(obj):
        if isinstance(obj, float):
            return obj
        elif isinstance(obj, dict):
            return dict((k, pretty_floats(v)) for k, v in obj.items())
        elif isinstance(obj, (list, tuple)):
            return list(map(lambda x: pretty_floats(x), obj))             
        out = np.asscalar(obj)
        return out
    print(json.dumps(pretty_floats(layers), indent=4, sort_keys=True))

if __name__ == "__main__":
    printConverted(convert(weights))