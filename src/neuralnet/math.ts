
export type Scalar = number;


export class Vector {
    length: number;

    constructor(public entries: number[]) {
        this.length = entries.length;
    }

    public multiply(other: Vector): Scalar {
        let sum = 0.0;
        for (let i = 0; i < this.entries.length; i++) {
            sum += this.entries[i] * other.entries[i];
        }
        return sum;
    }

    public add(other: Vector): Vector {
        for (let i = 0; i < this.length; i++) {
            this.entries[i] += other.entries[i];
        }
        return this;
    }
    
    public scale(factor: Scalar): Vector {
        for (let i = 0; i < this.length; i++) {
            this.entries[i] *= factor;
        }
        return this;
    }

    public getWithNewElement(element: Scalar): Vector {
        let newArr = this.entries.slice(0);
        newArr.push(element);
        return new Vector(newArr);
    }
    public getScaled(factor: Scalar): Vector {
        let scaledEntries = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            scaledEntries[i] = this.entries[i] * factor;
        }
        return new Vector(scaledEntries);
    }
}