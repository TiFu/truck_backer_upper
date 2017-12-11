"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = require("../model/world");
const math_1 = require("../math");
let world = new world_1.World();
world.setWorldLimited(false);
let tep1 = new math_1.Point(-10, 30);
let tep2 = new math_1.Point(80, -30);
function getRandomSteeringSignal() {
    const min = -1;
    const max = 1;
    return Math.random() * (max - min) + min;
}
let x = "";
let y = "";
for (let i = 0; i < 100000; i++) {
    world.randomizeMax(tep1, tep2, [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5 * Math.PI]);
    let steeringSignal = getRandomSteeringSignal();
    let stateVec = world.truck.getStateVector();
    let state = stateVec.entries.slice(2, stateVec.entries.length);
    x += state.reduce((prev, next) => prev + " " + next, "") + " " + steeringSignal + "\n";
    world.nextTimeStep(steeringSignal);
    let stateVec2 = world.truck.getStateVector();
    let state2 = stateVec.entries.slice(2, stateVec.entries.length);
    y += state2.reduce((prev, next) => prev + " " + next, "") + "\n";
    if (i % 10000 == 0) {
        console.log(i);
    }
}
const fs = require("fs");
fs.writeFileSync("./x", x);
fs.writeFileSync("./y", y);
//# sourceMappingURL=generateSamples.js.map