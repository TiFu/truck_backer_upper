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

export function createTruckControllerLessonsReworked(truck: HasLength) {
    return [
        new TruckLesson(truck, 0, 10000, () => new SGDNesterovMomentum(0.01, 0.9), 
                new Range(0.2,0.5), new Range(-0.1,0.1), 
                new Range(toRad(0),toRad(0)), new Range(toRad(-10),toRad(10)), 60),

        new TruckLesson(truck, 1, 10000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.35,0.8), new Range(-0.1,0.1), 
                new Range(toRad(-1),toRad(1)), new Range(toRad(-11),toRad(11)), 60),

        new TruckLesson(truck, 2, 10000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.5,1.1), new Range(-0.12,0.12), 
                new Range(toRad(-3),toRad(3)), new Range(toRad(-12),toRad(12)), 100),

        new TruckLesson(truck, 3, 10000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.5,1.1), new Range(-0.12,0.12), 
                new Range(toRad(-6.6),toRad(6.6)), new Range(toRad(-16),toRad(16)), 100),

        // inserted 1
        new TruckLesson(truck, 4, 10000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.2), new Range(-0.12,0.12), 
                new Range(toRad(-6.6),toRad(6.6)), new Range(toRad(-16),toRad(16)), 100),

        new TruckLesson(truck, 5, 10000, () => new SGDNesterovMomentum(0.01, 0.9), 
                new Range(0.5,1.2), new Range(-0.12,0.12), 
                new Range(toRad(-10),toRad(10)), new Range(toRad(-20),toRad(20)), 100),

        new TruckLesson(truck, 6, 10000, () => new SGDNesterovMomentum(0.01, 0.9), 
                new Range(0.5,1.2), new Range(-0.15,0.15),
                new Range(toRad(-10),toRad(10)), new Range(toRad(-20),toRad(20)), 100),

        new TruckLesson(truck, 7, 10000, () => new SGDNesterovMomentum(0.01, 0.9), 
                new Range(0.5,1.2), new Range(-0.15,0.15),
                new Range(toRad(-10),toRad(10)), new Range(toRad(-20),toRad(20)), 100),

        new TruckLesson(truck, 8, 10000, () => new SGDNesterovMomentum(0.01, 0.9), 
                new Range(0.5,1.2), new Range(-0.2,0.2),
                new Range(toRad(-10),toRad(10)), new Range(toRad(-20),toRad(20)), 100),

        new TruckLesson(truck, 9, 10000, () => new SGDNesterovMomentum(0.001, 0.9), 
                new Range(0.7,1.3), new Range(-0.2,0.2),
                new Range(toRad(-10),toRad(10)), new Range(toRad(-20),toRad(20)), 200),

                /*        new TruckLesson(truck, 4, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-3),toRad(3)), new Range(toRad(-6),toRad(6)), 100),

        new TruckLesson(truck, 5, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-3),toRad(3)), new Range(toRad(-10),toRad(10)), 100),

        new TruckLesson(truck, 6, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-6),toRad(6)), new Range(toRad(-10),toRad(10)), 100),

        new TruckLesson(truck, 7, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-6),toRad(6)), new Range(toRad(-15),toRad(15)), 100),

        new TruckLesson(truck, 8, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-10),toRad(10)), new Range(toRad(-15),toRad(15)), 100),

        new TruckLesson(truck, 9, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.1), new Range(-0.2,0.2), 
                new Range(toRad(-15),toRad(15)), new Range(toRad(-20),toRad(20)), 200),

        new TruckLesson(truck, 9, 1000, () => new SGDNesterovMomentum(0.1, 0.9), 
                new Range(0.7,1.2), new Range(-0.2,0.2), 
                new Range(toRad(-15),toRad(15)), new Range(toRad(-20),toRad(20)), 200),
*/
        ]
}

export function createTruckControllerLessons(truck: HasLength) {
    let optimizers: Array<() => Optimizer> = [
    ]
    for (let i = 0; i < 100; i++) {
        let lr = 0.1;
        if (i >= 85) {
            lr = 0.01;
        }
        if (i >= 90) {
            lr = 0.001;
        }
        if (i >= 94) {
            lr = 0.00000001;
        }
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

    let lessonCountX = 100;

    for (let i = 0; i < lessonCountX; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCountX);
        let yR = rangeForStep(minY, maxY, i, lessonCountX);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCountX);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCountX);
        let samples = 5000;
        lessons.push(new TruckLesson(truck, i, samples,  optimizers[i], xR, yR, trailerR, cabR, 1000));
    }

    for (let lesson of lessons) {
        console.log(lesson.x.getScaled(1 / truck.getLength()), lesson.y.getScaled(1 / truck.getLength()), lesson.trailerAngle.getScaled(180 / Math.PI), lesson.cabAngle.getScaled(180 / Math.PI))
    }
    //    console.log("Created lessons: ", lessons);
    return lessons;
}