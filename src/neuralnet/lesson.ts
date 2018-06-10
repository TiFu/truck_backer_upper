export class Range {

    public constructor(public min: number,public max: number) {

    }
}
import {Point} from '../math';
import {Vector} from '../neuralnet/math'
import {Truck} from '../model/truck'
import {Dock, HasLength} from '../model/world';
import { SGDNesterovMomentum, Optimizer, SGD } from './optimizers';

export class Lesson {

    public constructor(public object: HasLength, public no: number, public samples: number, public maxSteps: number, public optimizer: () => Optimizer) {
    }
}

export class CarLesson extends Lesson {
    public constructor(object: HasLength, no: number, samples: number, maxSteps: number, optimizer: () => Optimizer, public x: Range, public y: Range, public angle: Range) {
        super(object, no, samples, maxSteps, optimizer);
    }   
    public getBounds(): Vector {
        let length = this.object.getLength();
        let tep1 = new Point(this.x.min * length, this.y.max * length);
        let tep2 = new Point(this.x.max * length, this.y.min * length);
        let angle = [this.angle.min, this.angle.max];

        return new Vector(
            [
                tep1.x, 
                tep1.y,
                tep2.x,
                tep2.y,
                angle[0],
                angle[1],
            ]
        );
    }
    
}

export class TruckLesson extends Lesson {

    public constructor(object: HasLength, no: number, samples: number, optimizer: () => Optimizer,
        public x: Range, public y: Range, public trailerAngle: Range, 
        public cabAngle: Range, public maxSteps: number){ 
            super(object, no, samples, maxSteps, optimizer);
    }

    public getBoundsDescription(): any {
        let bounds = this.getBounds().entries;
        return {
            "tep1.x": bounds[0],
            "tep1.y": bounds[1],
            "tep2.x": bounds[2],
            "tep2.y": bounds[3],
            "minAngleTrailer": bounds[4] * 180 / Math.PI,
            "maxAngleTrailer": bounds[5] * 180 / Math.PI,
            "minAngleCabin": bounds[6] * 180 / Math.PI,
            "maxAngleCabin": bounds[7] * 180 / Math.PI
        }
    }
    public getBounds(): Vector {
        let length = this.object.getLength();
        let tep1 = new Point(this.x.min * length, this.y.max * length);
        let tep2 = new Point(this.x.max * length, this.y.min * length);
        let maxAngleTrailer = [this.trailerAngle.min, this.trailerAngle.max];
        let maxAngleCabin = [this.cabAngle.min, this.cabAngle.max];

        return new Vector(
            [
                tep1.x, 
                tep1.y,
                tep2.x,
                tep2.y,
                maxAngleTrailer[0],
                maxAngleTrailer[1],
                maxAngleCabin[0],
                maxAngleCabin[1]
            ]
        );
    }
}

function getValueAt(r: Range, currentStep: number, maxSteps: number) {
    return r.min + currentStep / maxSteps * (r.max - r.min);
}

function rangeForStep(minR: Range, maxR: Range, step: number, maxSteps: number) {
    let min = getValueAt(minR, step, maxSteps - 1);
    let max = getValueAt(maxR, step, maxSteps - 1);
    return new Range(min, max);
}

export function createCarJacobianLessons(truck: HasLength) {
    let optimizers: Array<() => Optimizer> = [
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.1, 0.9),
        () => new SGDNesterovMomentum(0.1, 0.9),
        () => new SGDNesterovMomentum(0.1, 0.9),
    ]
    let lessons: Array<Lesson> = []

    //distance lessons
    let minX = new Range(1, 2);
    let maxX = new Range(1, 4);
    let minY = new Range(-0.1, -1);
    let maxY = new Range(0.1, 1);
    let minCabAngle = new Range(- 30/180*Math.PI,-30 / 180 * Math.PI);
    let maxCabAngle = new Range(30/180*Math.PI, 30/180*Math.PI);
    let minTrailerAngle = new Range(-30/180 * Math.PI, -180/180*Math.PI);
    let maxTrailerAngle = new Range(30/180 * Math.PI,180/180 * Math.PI);
    let lessonCountX = 12;

    for (let i = 0; i < lessonCountX; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountX);
        let yR = rangeForStep(minY, maxY, i, lessonCountX);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountX);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountX);
        let samples = 10000;
        lessons.push(new CarLesson(truck, i, samples, 2 * xR.max + 50, optimizers[i], xR, yR, trailerR));
    }
//    console.log("Created lessons: ", lessons);
    return lessons;
}

export function createCarControllerLessons(truck: HasLength) {
    let optimizers: Array<() => Optimizer> = [
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(1, 0.9),
        () => new SGDNesterovMomentum(0.01, 0.9), // didn't work YOLO
    ]
    let lessons: Array<Lesson> = []

    //distance lessons
    let minX = new Range(1, 2);
    let maxX = new Range(1, 4);
    let minY = new Range(-0.1, -1);
    let maxY = new Range(0.1, 1);
    let minTrailerAngle = new Range(-30/180 * Math.PI, -180/180*Math.PI);
    let maxTrailerAngle = new Range(30/180 * Math.PI,180/180 * Math.PI);
    let lessonCountX = 12;

    for (let i = 0; i < lessonCountX; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountX);
        let yR = rangeForStep(minY, maxY, i, lessonCountX);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountX);
        let samples = 10000;
        lessons.push(new CarLesson(truck, i, samples, 2 * xR.max + 50, optimizers[i], xR, yR, trailerR));
    }
//    console.log("Created lessons: ", lessons);
    return lessons;
}