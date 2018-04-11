import {Vector} from './math';

export type WeightInitializer = (dim: number) => Vector;

export function StaticInitializer(weights: number[]): WeightInitializer {
    return (dim: number) => {
        if (weights.length != dim + 1) {
            throw new Error("Expected dimension " + (dim + 1) + " but got " + weights.length + "(" + weights + ") in static weight initializer");
        } else {
            // create copy - training updates!
            return new Vector(weights.slice());
        }
    }
}
/*
 * D. Nguyen and B. Widrow, ``Improving the Learning Speed of 2-Layer Neural
 * Networks by Choosing Initial Values of the Adaptive Weights,'' Proceedings of
 * the International Joint Conference on Neural Networks (IJCNN), 3:21-26, June 1990.
 */
 export function TwoLayerInitializer(overlap: number, neuronsInLayer: number): WeightInitializer {

    return (dim: number) => {
        let targetScale = overlap * Math.pow(neuronsInLayer, 1 / dim);
        let weights = getRandomWeights(dim, 2);
        weights = weights.scale(targetScale / weights.getLength())
        let bias = getRandom(targetScale);
        return weights.getWithNewElement(bias);
    }
}

function getRandomWeights(inputDim: number, initialWeightRange: number): Vector {
    let random = [];
    for (let i = 0; i < inputDim; i++) {
        random.push(getRandom(initialWeightRange)); // [-0.3, 0.3]
    }
//        console.log("Initial Weights: " + random);
    return new Vector(random);
}

function getRandom(range: number){
    return Math.random() * 2 * range - range
}
