import {WeightedMSE} from '../neuralnet/error';
import {Vector} from '../neuralnet/math'

let mse = new WeightedMSE(new Vector([1, 2, 3]))

console.log(mse.getError(new Vector([1.25,2.5, 4]), new Vector([1, 2, 3])))

console.log(mse.getErrorDerivative(new Vector([1.25,2.5, 4]), new Vector([1, 2, 3])))