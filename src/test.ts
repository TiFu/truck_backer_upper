import {Point, isLeftOf} from './math';

let a = new Point(0, 0);
let b = new Point(0, 1);
let c = new Point(0.19680722111307206, -2.3747211246711846);
console.log(isLeftOf(a, b, c));