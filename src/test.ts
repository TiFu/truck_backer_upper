import { TruckEmulator, Truck } from "./model/truck";
import { Point } from "./math";
import { Dock } from "./model/world";
import { Vector, Matrix } from "./neuralnet/math";

function scaleU(u: number) {
    return u / (70 / 180 * Math.PI);
}
function scaleX(x: number) {
    return (x - 50) / 50;
}

function scaleY(y: number) {
    return y / 50;
}

function scaleAngle(angle: number) {
    return angle / Math.PI;
}

function unscaleU(u: number) {
    return u * 70 / 180 * Math.PI
}

function unscaleX(x: number) {
    return x * 50 + 50;
}

function unscaleY(y: number) {
    return y * 50;
}

function unscaleAngle(angle: number) {
    return angle * Math.PI;
}

function forward(x: number, y: number, cab: number, trailer: number, u: number): number[] {
    let steeringAngle = unscaleU(u);
    cab = unscaleAngle(cab);
    trailer = unscaleAngle(trailer);
    x = unscaleX(x);
    y = unscaleY(y);

    //    let steeringAngle = u;
    let trailerLength = 14;
    let cabinLength = 6;

    let A = 1 * 1 * Math.cos(steeringAngle);
    let B = A * Math.cos(cab - trailer)

    let newX = x - B * Math.cos(trailer);
    let newY = y - B * Math.sin(trailer);
    let newTrailer = trailer -  Math.asin(A * Math.sin(cab - trailer) / trailerLength)
    let newCab = cab +  Math.asin(1 * Math.sin(steeringAngle) / (trailerLength + cabinLength))

    return [
        scaleX(newX),
        scaleY(newY),
        scaleAngle(newCab),
        scaleAngle(newTrailer)
    ]
}

function der(a: number, b: number, eps: number) {
    return (b - a) / eps;
}

let eps = 10e-9;

let x = scaleX(20);
let y = scaleY(20);
let cab = scaleAngle(-30 / 180 * Math.PI + 2 * Math.PI);
let trailer = scaleAngle(35 / 180 * Math.PI + 2 * Math.PI);
let u = scaleU(35/180*Math.PI); // 35 degrees

let a = forward(x, y, cab, trailer, u);

let dx = forward(x + eps, y, cab, trailer, u);
let dy = forward(x, y + eps, cab, trailer, u);
let dc = forward(x, y, cab + eps, trailer, u);
let dt = forward(x, y, cab, trailer + eps, u);
let du = forward(x, y, cab, trailer, u + eps);

let errorMatrix = [];
for (let i = 0; i < 4; i++) {
    errorMatrix.push(new Array(5));
}

for (let i = 0; i < 4; i++) {
    errorMatrix[i][0] = der(a[i], dx[i], eps);
    errorMatrix[i][1] = der(a[i], dy[i], eps);
    errorMatrix[i][2] = der(a[i], dc[i], eps);
    errorMatrix[i][3] = der(a[i], dt[i], eps);
    errorMatrix[i][4] = der(a[i], du[i], eps);
}

console.log("Numerial Derivative Matrix: ");
console.log(errorMatrix);

let truck = new Truck(new Point(20, 20), 35/180 * Math.PI, 30/180*Math.PI, new Dock(new Point(0,0)), []); 
let te = new TruckEmulator(truck);

te.forward(new Vector([x, y, cab, trailer, u]));
// i'm actually interested in the matrix not the derivative wrt to an error term
let error = new Vector([1,1,1,1])
let derivative = te.backward(error)

console.log("Estimated Error");
console.log(error.multiplyMatrixFromLeft(new Matrix(errorMatrix)).entries);


console.log("Real Error");
console.log(derivative.entries);
