import {World} from '../model/world'
import {Point} from '../math'


let world = new World();
world.setWorldLimited(false);
let tep1 = new Point(-10, 30);
let tep2 = new Point(80, -30);


function getRandomSteeringSignal() {
    const min = -1
    const max = 1;
    return Math.random() * (max - min) + min; //The maximum is inclusive and the minimum is inclusive 
}

let x = ""
let y = ""
for (let i = 0; i < 100000; i++) {
    world.randomizeMax(tep1, tep2, [-Math.PI, Math.PI], [-0.5 * Math.PI, 0.5*Math.PI]);
    let steeringSignal = getRandomSteeringSignal()

    let stateVec = world.truck.getStateVector();
    let state = stateVec.entries.slice(2, stateVec.entries.length)
    x += state.reduce((prev, next) => prev + " " + next, "") + " " + steeringSignal + "\n"
    world.nextTimeStep(steeringSignal)

    let stateVec2 = world.truck.getStateVector();
    let state2 = stateVec.entries.slice(2, stateVec.entries.length);
    y += state2.reduce((prev, next) => prev + " " + next, "") + "\n"    
    if (i % 10000 == 0) {
        console.log(i)
    }
}

import * as fs from 'fs'

fs.writeFileSync("./x", x);
fs.writeFileSync("./y", y);