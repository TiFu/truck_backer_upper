
export type Scalar = number;


export class Vector {
    length: number;
    public entries: number[];

    constructor(entries: number[]) {
        this.length = entries.length;
        this.entries = new Array(entries.length);
        // create a copy of the input array
        for (let i = 0; i < entries.length; i++){ 
            this.entries[i] = entries[i];
        }
    }

    public getLength(): number {
        let sum = 0;
        for (let i = 0; i < this.entries.length; i++) {
            sum += this.entries[i] * this.entries[i];
        }
        return Math.sqrt(sum);
    }

    public isEntryNaN() {
        for (let i = 0; i < this.entries.length; i++) {
            if (Number.isNaN(this.entries[i])) {
                return true;
            }
        }
        return false;
    }

    public multiplyElementWise(other: Vector): Vector {
        for (let i = 0; i < this.entries.length; i++) {
            this.entries[i] *= other.entries[i];
        }
        return this;
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

    public getWithoutLastElement(): Vector {
        let newArr = this.entries.slice(0);
        newArr.pop();
        return new Vector(newArr);
    }
    public getScaled(factor: Scalar): Vector {
        let scaledEntries = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            scaledEntries[i] = this.entries[i] * factor;
        }
        return new Vector(scaledEntries);
    }

    public toString(): string {
        let str = "(";
        for (let i = 0; i < this.entries.length; i++) {
            if (i == 0) {
                str += this.entries[i];
            } else {
            str += ", " + this.entries[i];
            }
        }
        str += ")";
        return str;
    }
}

export function plus(a: Vector, b: Vector): Vector {
    let entries = [];
    for (let i = 0; i < a.length; i++) {
        entries[i] = a.entries[i] + b.entries[i];
    }  
    return new Vector(entries);
}