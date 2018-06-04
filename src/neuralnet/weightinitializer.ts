import {Vector} from './math';

export abstract class WeightInitializer {

    public getName() {
        return this.constructor.name;
    }

    abstract initialize(dim: number) : Vector;
}

//export type WeightInitializer = (dim: number) => Vector;

export class StaticInitializer extends WeightInitializer {

    public constructor(private weights: number[]) {
        super();
    }

    public initialize(dim: number) {
        if (this.weights.length != dim + 1) {
            throw new Error("Expected dimension " + (dim + 1) + " but got " + this.weights.length + "(" + this.weights + ") in static weight initializer");
        } else {
            // create copy - training updates!
            return new Vector(this.weights.slice());
        }
    }
}

/*
 * D. Nguyen and B. Widrow, ``Improving the Learning Speed of 2-Layer Neural
 * Networks by Choosing Initial Values of the Adaptive Weights,'' Proceedings of
 * the International Joint Conference on Neural Networks (IJCNN), 3:21-26, June 1990.
 */
export class TwoLayerInitializer extends WeightInitializer {
    public constructor(public overlap: number, public neuronsInLayer: number) {
        super();
    }

    public initialize(dim: number): Vector {
        let targetScale = this.overlap * Math.pow(this.neuronsInLayer, 1 / dim);
        let weights = getRandomWeights(dim, 2);
        weights = weights.scale(targetScale / weights.getLength())
        let bias = getRandom(targetScale);
        return weights.getWithNewElement(bias);        
    }
}

export class RandomWeightInitializer extends WeightInitializer {
    
    public constructor(public weightRange: number) {
        super();
    }

    public initialize(dim: number): Vector {
        return getRandomWeights(dim + 1, this.weightRange);       
    }
}

function getRandomWeights(inputDim: number, initialWeightRange: number): Vector {
    let random = [];
    for (let i = 0; i < inputDim; i++) {
        random.push(getRandom(initialWeightRange)); // [-0.3, 0.3]
    }
    return new Vector(random);
}

function getRandom(range: number){
    return Math.random() * 2 * range - range
}
