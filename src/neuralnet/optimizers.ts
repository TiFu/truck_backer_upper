import { Vector, } from './math';

export abstract class Optimizer {

    abstract getName(): string;
    abstract calculateUpdate(weightDerivative: Vector): Vector;

}

export class SGD extends Optimizer {

    public constructor(public learningRate: number = 0.1) {
        super();
    }

    public getName() {
        return "SGD";
    }

    calculateUpdate(weightDerivative: Vector): Vector {
        return weightDerivative.scale(-1 * this.learningRate);
    }
}

export class SGDNesterovMomentum extends Optimizer {
    private moments: Vector | null;

    public constructor(public learningRate: number = 0.1, public momentum: number = 0.9) {
        super();
        this.moments = null;
    }

    public getName(): string {
        return "SGDNesterovMomentum";
    }
    
    calculateUpdate(weightDerivative: Vector): Vector {
        if (this.moments == null) {
            this.moments = new Vector(new Array(weightDerivative.length).fill(0))
        }

        // calculate velocity as moments * momentum - lr * g;
        let scaledMoments = this.moments.scale(this.momentum);
        // note -1 scaling
        let scaledWeightDerivative = weightDerivative.getScaled(this.learningRate).scale(-1);
        let velocity = scaledMoments.add(scaledWeightDerivative);

        this.moments = velocity;

        // momentum * v - lr * g
        let update = velocity.getScaled(this.momentum).add(scaledWeightDerivative);
        // let update = velocity;
        return update;
    }

    public toString(): String {
        return this.getName() + "(" + this.learningRate + ", " + this.momentum + ")";
    }
}