"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const train_1 = require("./neuralnet/train");
const world_1 = require("./model/world");
const implementations_1 = require("./neuralnet/implementations");
let world = new world_1.World();
let trainTruckEmulator = new train_1.TrainTruckEmulator(world, implementations_1.emulatorNet);
let steps = 250000;
//# sourceMappingURL=train.js.map