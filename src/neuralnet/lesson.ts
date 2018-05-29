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

    public constructor(private truck: HasLength, public no: number, public samples: number, 
        public x: Range, public y: Range, public trailerAngle: Range, 
        public cabAngle: Range, public maxSteps: number, public optimizer: () => Optimizer){ 

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
        let length = this.truck.getLength();
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

export function createTruckLessons(truck: HasLength) {
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
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
        () => new SGDNesterovMomentum(0.75, 0.9),
    ]
    let lessons: Array<Lesson> = []

    //distance lessons
    let minX = new Range(1, 2);
    let maxX = new Range(1, 4);
    let minY = new Range(-0.1, -1);
    let maxY = new Range(0.1, 1);
    let minCabAngle = new Range(- 30/180*Math.PI,-30 / 180 * Math.PI);
    let maxCabAngle = new Range(30/180*Math.PI, 30/180*Math.PI);
    let minTrailerAngle = new Range(-30/180 * Math.PI, -30/180*Math.PI);
    let maxTrailerAngle = new Range(30/180 * Math.PI,30/180 * Math.PI);
    let lessonCountX = 12;

    for (let i = 0; i < lessonCountX; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountX);
        let yR = rangeForStep(minY, maxY, i, lessonCountX);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountX);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountX);
        let samples = 10000;
        lessons.push(new Lesson(truck, i, samples, xR, yR, trailerR, cabR, 2 * xR.max + 30, optimizers[i]));
    }

    //angle lessons
    optimizers = [
        () => new SGD(0.01),  // 12
        () => new SGD(0.01) , //13
        () => new SGD(0.01), // 14 
        () => new SGDNesterovMomentum(0.0001, 0.9), //15
        () => new SGDNesterovMomentum(0.0001, 0.9), //16
        () => new SGDNesterovMomentum(0.0001, 0.9), //17
        () => new SGDNesterovMomentum(0.0001, 0.9), // 18
        () => new SGDNesterovMomentum(0.0001, 0.9), // 19
        () => new SGDNesterovMomentum(0.00005, 0.9), // lesson 20
        () => new SGDNesterovMomentum(0.00005, 0.9),
        () => new SGDNesterovMomentum(0.00005, 0.9),
        () => new SGDNesterovMomentum(0.00005, 0.9),        
    ]
    
    minX = new Range(1.5, 2);
    maxX = new Range(2, 4);
    minY = new Range(0, 0);
    maxY = new Range(0, 0);
    minCabAngle = new Range(- 30/180*Math.PI,-90 / 180 * Math.PI);
    maxCabAngle = new Range(30/180*Math.PI, 90/180*Math.PI);
    minTrailerAngle = new Range(-30/180 * Math.PI, -90/180*Math.PI);
    maxTrailerAngle = new Range(30/180 * Math.PI,90/180 * Math.PI);
    let lessonCountAngle = 12;

    for (let i = 0; i < lessonCountAngle; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountAngle);
        let yR = rangeForStep(minY, maxY, i, lessonCountAngle);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountAngle);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountAngle);
        let samples = 5000;
        lessons.push(new Lesson(truck, i + lessonCountX , samples, xR, yR, trailerR, cabR, 2 * xR.max + 30, optimizers[i]));
    }

    // y distance lessons
    optimizers = [
        () => new SGDNesterovMomentum(0.0001, 0.9),
        () => new SGDNesterovMomentum(0.0001, 0.9),
        () => new SGDNesterovMomentum(0.00001, 0.9),
        () => new SGDNesterovMomentum(0.000001, 0.9),
        () => new SGDNesterovMomentum(0.00001, 0.9),
        () => new SGDNesterovMomentum(0.00001, 0.9),
        () => new SGDNesterovMomentum(0.00001, 0.9),
        () => new SGDNesterovMomentum(0.000001, 0.9),
        () => new SGDNesterovMomentum(0.000001, 0.9),
        () => new SGDNesterovMomentum(0.000001, 0.9),
        () => new SGDNesterovMomentum(0.0000005, 0.9),
        () => new SGDNesterovMomentum(0.0000001, 0.9),
    ]

    minX = new Range(1.5, 2);
    maxX = new Range(2, 4);
    minY = new Range(0, 0);
    maxY = new Range(0, 0);
    minCabAngle = new Range(- 90/180*Math.PI,-180 / 180 * Math.PI);
    maxCabAngle = new Range(90/180*Math.PI, 180/180*Math.PI);
    minTrailerAngle = new Range(-90/180 * Math.PI, -180/180*Math.PI);
    maxTrailerAngle = new Range(90/180 * Math.PI,180/180 * Math.PI);
    let lessonCountY = 12;

    for (let i = 0; i < lessonCountY; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountY);
        let yR = rangeForStep(minY, maxY, i, lessonCountY);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountY);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountY);
        let samples = 5000;
        lessons.push(new Lesson(truck, i + lessonCountY + lessonCountX , samples, xR, yR, trailerR, cabR, 2 * xR.max + 30, optimizers[i]));
    }


//    console.log("Created lessons: ", lessons);
    return lessons;
}