import {Point} from './math'
import {CarEmulator, Car} from './model/car'
let car = new Car(new Point(5, 5), 0);
let emulator = new CarEmulator(car)
import {Vector} from './neuralnet/math'
emulator.forward(new Vector([5, 5, 0, 45/180*Math.PI]));
console.log(emulator.backward(new Vector([3, 3, 45/180 * Math.PI])));