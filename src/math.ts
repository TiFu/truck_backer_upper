export interface Object2D {
    x: number;
    y: number;
}
export type Scalar = number;

export class Point implements Object2D {
    constructor(public x: number, public y: number) {
    }

    public getVectorTo(b: Point) {
        return new Vector(b.x - this.x, b.y - this.y);
    }

    public addVector(b: Vector) {
        return new Point(this.x + b.x, this.y + b.y)
    }
    public toString(): string {
        return "(" + this.x + "," + this.y + ")";
    }
}

export class StraightLine {
    constructor(public base: Point, public direction: Vector) {

    }

    public isLeftOf(b: Point) {
        return isLeftOf(this.base, plus(this.base, this.direction), b);
    }
}
export class Vector implements Object2D {
    constructor(public x: number,public  y: number) {
    }

    getLength(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    scale(factor: number) {
        this.x = this.x * factor;
        this.y = this.y * factor
        return this;
    }

    getOrthogonalVector(): Vector {
        return new Vector(this.y, - this.x);
    }
}

export type Angle = number;

export function isLeftOf(a: Point, b: Point, testPoint: Point) {
    let d = (testPoint.x - a.x) * (b.y - a.y) - (testPoint.y - a.y) * (b.x - a.x);
    return d <= 0;
}
// TODO: duplicate of rotateVector
export function rotate(b: Vector, degree: Angle) {
    let x = Math.cos(degree) * b.x - b.y * Math.sin(degree);
    let y = Math.sin(degree) * b.x + b.y * Math.cos(degree);
    return new Vector(x, y);
}
export function plus(a: Point, b: Vector | Point) {
    return new Point(a.x + b.x, a.y + b.y);
}
export function minus(a: Point, b: Vector | Point) {
    return new Point(a.x - b.x, a.y - b.y);
}

export function mapPoint(a: Point, scale: number) {
    return new Point(a.x * scale, a.y * - scale);
}

export function scale(a: Vector, scale: number) {
    return new Vector(a.x * scale, a.y * scale);
}

export function calculateVector(a: Point, b: Point): Vector {
    return new Vector(b.x - a.x, b.y - a.y);
}

export function scalarProduct(a: Vector, b: Vector): number {
    return a.x * b.x + a.y * b.y;
}

export function getAngle(a: Vector, b: Vector): Angle {
    return Math.acos(scalarProduct(a, b) / (a.getLength() * b.getLength()));
}

export function rotateVector(a: Vector, angle: Angle): Vector { 
    let newX = a.x * Math.cos(angle) - a.y * Math.sin(angle);
    let newY = a.x * Math.sin(angle) + a.y * Math.cos(angle);
    return new Vector(newX, newY);
}