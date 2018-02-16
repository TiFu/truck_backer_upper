import {Vector, } from './math';

export interface Optimizer {
    
    calculateUpdate(weightDerivative: Vector): Vector;

}

export class SGD implements Optimizer {

    public constructor(private learningRate: number = 0.1) {

    }

    calculateUpdate(weightDerivative: Vector): Vector {
        return weightDerivative.scale(this.learningRate);
    }
}

export class SGDNesterovMomentum implements Optimizer { 
    private moments: Vector;

    public constructor(private learningRate: number = 0.1, private momentum: number = 0.9) {

    }

    calculateUpdate(weightDerivative: Vector): Vector {
        if (this.moments == null) {
            this.moments = new Vector(new Array(weightDerivative.length).fill(0))
        }
        
        // calculate velocity as moments * momentum - lr * g;
        let scaledMoments = this.moments.getScaled(this.momentum);
        // note -1 scaling
        let scaledWeightDerivative = weightDerivative.getScaled(this.learningRate).scale(-1);
        let velocity = scaledMoments.add(scaledWeightDerivative);
        
        this.moments = velocity;

        // momentum * v - lr * g
        let update = velocity.getScaled(this.momentum).add(scaledWeightDerivative);
        return update;
    }
}