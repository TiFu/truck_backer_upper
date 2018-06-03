import {Point, Vector, plus, minus, scale, mapPoint} from '../math'


export class CoordinateSystemTransformation {

    /**
     * 
     * @param scaleFactor scale factor between the original coordinate system and the mapped coord systeme
     * @param nullPoint mapping from (0|0) into the mapped coord system
     */
    public constructor(private scaleFactorX: number, private scaleFactorY: number, private nullPoint: Vector) {

    }

    public mapIntoNewCordSystem(p: Point): Point {
        return plus(mapPoint(p, this.scaleFactorX, this.scaleFactorY), this.nullPoint);
    }

    public mapIntoOldCordSystem(p: Point): Point {
        return minus(mapPoint(p, 1 / this.scaleFactorX, this.scaleFactorY), this.nullPoint);
    }
}