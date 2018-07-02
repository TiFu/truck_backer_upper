export class Range {

    public constructor(public min: number,public max: number) {

    }

    public getScaled(factor: number) {
        return new Range(this.min * factor, this.max * factor);
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
    public x: Range;
    public y: Range;

    public constructor(object: HasLength, no: number, samples: number, maxSteps: number, optimizer: () => Optimizer, x: Range, y: Range, public angle: Range) {
        super(object, no, samples, maxSteps, optimizer);
        let l = object.getLength();
        this.x = x.getScaled(l);
        this.y = y.getScaled(l);
    }   

    public getBounds(): Vector {
        let tep1 = new Point(this.x.min, this.y.max);
        let tep2 = new Point(this.x.max, this.y.min);
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
    public x: Range;
    public y: Range;

    public constructor(object: HasLength, no: number, samples: number, optimizer: () => Optimizer,
        x: Range, y: Range, public trailerAngle: Range, 
        public cabAngle: Range, public maxSteps: number){ 
            super(object, no, samples, maxSteps, optimizer);
            let l = object.getLength();
            this.x = x.getScaled(l);
            this.y = y.getScaled(l);
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
        let tep1 = new Point(this.x.min, this.y.max);
        let tep2 = new Point(this.x.max, this.y.min);
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

function getQuadraticValueAt(r: Range, step: number, maxSteps: number) {
    let minC = r.min;
    let minA = (r.max - minC) / (maxSteps * maxSteps);         // minR.max = a * maxSteps^2 + minC
    let min = minA * step * step + minC;
    return min;
}

function quadraticRangeForStep(minR: Range, maxR: Range, step: number, maxSteps: number) {
    let min = getQuadraticValueAt(minR, step, maxSteps - 1);
    let max = getQuadraticValueAt(maxR, step, maxSteps - 1);
    return new Range(min, max);
}

export function linearAndQuadraticRangeForStep(minR: Range, maxR: Range, step: number, maxSteps: number, changeAtStep: number) {

    if (step <= changeAtStep) {
        return quadraticRangeForStep(minR, maxR, step, maxSteps);
    } else {
        let newMin = quadraticRangeForStep(minR, maxR, changeAtStep, maxSteps);
        let newMinR = new Range(newMin.min, minR.max);
        let newMaxR = new Range(newMin.max, maxR.max);
        return rangeForStep(newMinR, newMaxR, step - changeAtStep, maxSteps - changeAtStep);
    }
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
        let yR = quadraticRangeForStep(minY, maxY, i, lessonCountX);
        console.log("y: ", yR.min, yR.max);
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

function toRad(deg: number) {
    return deg / 180 * Math.PI;
}

export function createTruckControllerLessons(truck: HasLength) {
    let optimizers: Array<() => Optimizer> = [
    ]
    for (let i = 0; i < 100; i++) {
        let lr = 0.1;
        optimizers.push(((lr) => {
            return () => new SGDNesterovMomentum(lr, 0.9);
        })(lr));
    }
    let lessons: Array<TruckLesson> = []

    //distance lessons
    let minX = new Range(0.2, 2);
    let maxX = new Range(0.5, 4);
    // 1.5 also works but higher error
    let minY = new Range(-0.1, -1.0); // TODO: quadratic scaling? => should introduce the truck to this kind of deviation and then make it harder
    let maxY = new Range(0.1, 1.0);
    let minTrailerAngle = new Range(-0/180 * Math.PI, -90/180*Math.PI);
    let maxTrailerAngle = new Range(0/180 * Math.PI,90/180 * Math.PI);
    let minCabAngle = new Range(-10/180 * Math.PI, -90/180*Math.PI);
    let maxCabAngle = new Range(10/180 * Math.PI,90/180 * Math.PI);

    let lessonCountX = 20;

    for (let i = 0; i < lessonCountX; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountX);
        let yR = rangeForStep(minY, maxY, i, lessonCountX);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountX);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountX);
        let samples = 1000;
        lessons.push(new TruckLesson(truck, i, samples,  optimizers[i], xR, yR, trailerR, cabR, 1000));
    }

    for (let lesson of lessons) {
        console.log(lesson.x.getScaled(1 / truck.getLength()), lesson.y.getScaled(1 / truck.getLength()), lesson.trailerAngle.getScaled(180 / Math.PI), lesson.cabAngle.getScaled(180 / Math.PI))
    }
    //    console.log("Created lessons: ", lessons);
    return lessons;
}