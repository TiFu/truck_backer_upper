export class Range {

    public constructor(public min: number,public max: number) {

    }
}
import {Point} from '../math';
import {Vector} from '../neuralnet/math'
import {Truck} from '../model/truck'
import {Dock, HasLength} from '../model/world';

export class Lesson {

    public constructor(private truck: HasLength, public no: number, public samples: number, 
        public x: Range, public y: Range, public trailerAngle: Range, 
        public cabAngle: Range, public maxSteps: number){ 

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
    let min = getValueAt(minR, step, maxSteps);
    let max = getValueAt(maxR, step, maxSteps);
    return new Range(min, max);
}

export function createTruckLessons(truck: HasLength) {
    let lessons: Array<Lesson> = []

    let minX = new Range(2, 2);
    let maxX = new Range(2, 4);
    let minY = new Range(0, -2);
    let maxY = new Range(0, 2);
    let minCabAngle = new Range(- 30/180*Math.PI,-50 / 180 * Math.PI);
    let maxCabAngle = new Range(30/180*Math.PI, 50/180*Math.PI);
    let minTrailerAngle = new Range(-30/180 * Math.PI, -90/180*Math.PI);
    let maxTrailerAngle = new Range(30/180 * Math.PI, 90/180 * Math.PI);
    let lessonCount = 12;

    for (let i = 0; i < lessonCount; i++) {
        let xR = rangeForStep(minX, maxX, i, lessonCount);
        let yR = rangeForStep(minY, maxY, i, lessonCount);
        let trailerR = rangeForStep(minTrailerAngle, maxTrailerAngle, i, lessonCount);
        let cabR = rangeForStep(minCabAngle, maxCabAngle, i, lessonCount);
        let samples = 5000;
        lessons.push(new Lesson(truck, i, samples, xR, yR, trailerR, cabR, 2 * xR.max + 30));
        if (i == lessonCount - 1) {
            lessons.push(new Lesson(truck, i, 10000, xR, yR, trailerR, cabR, 2 * xR.max + 100));
        }
    }
    return lessons;
}