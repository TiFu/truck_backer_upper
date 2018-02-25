export class Range {

    public constructor(public min: number,public max: number) {

    }
}

export class Lesson {

    public constructor(public no: number, public samples: number, 
        public x: Range, public y: Range, public trailerAngle: Range, 
        public cabAngle: Range, public maxSteps: number){ 

    }
}

function getValueAt(r: Range, currentStep: number, maxSteps: number) {
    return r.min + currentStep / maxSteps * (r.max - r.min);
}

function rangeForStep(minR: Range, maxR: Range, step: number, maxSteps: number) {
    let min = getValueAt(minR, step, maxSteps);
    let max = getValueAt(maxR, step, maxSteps);
    return new Range(min, max);
}

export var lessons: Array<Lesson> = []

let minX = new Range(0.5, 0.5);
let maxX = new Range(0.5, 0.5);
let minY = new Range(0, 0);
let maxY = new Range(0, 0);
let minCabAngle = new Range(- 30/180*Math.PI,-30 / 180 * Math.PI);
let maxCabAngle = new Range(30/180*Math.PI, 30/180*Math.PI);
let minTrailerAngle = new Range(0, 0);
let maxTrailerAngle = new Range(0, 0);
let lessonCount = 10;

for (let i = 0; i < lessonCount; i++) {
    let xR = rangeForStep(minX, maxX, i, lessonCount);
    let yR = rangeForStep(minY, maxY, i, lessonCount);
    let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCount);
    let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCount);
    let samples = i < 12 ? 1000 : 2000;
    lessons.push(new Lesson(i, samples, xR, yR, trailerR, cabR, xR.max * 5 * 20 + 100));
    if (i == lessonCount - 1) {
        lessons.push(new Lesson(i, 10000, xR, yR, trailerR, cabR, xR.max * 5 * 20 + 30));
    }
}

