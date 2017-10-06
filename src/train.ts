import {TrainTruckEmulator} from './neuralnet/train'
import {World} from './model/world'
import {emulatorNet} from './neuralnet/implementations'

let world = new World();
let trainTruckEmulator = new TrainTruckEmulator(world, emulatorNet);

let steps = 250000

/*for (let i = 0; i < steps; i++) {
//    console.log(i + " of " + steps);
    world.randomize();
    trainTruckEmulator.train(5);
}*/

//console.log(trainTruckEmulator.getEmulatorNet().getWeights())