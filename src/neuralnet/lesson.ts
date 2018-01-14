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