
export type Scalar = number;

export class Matrix {
    content: number[][];

    public constructor(entries: number[][]) {
        this.content = new Array(entries.length);
        let dimensions = entries[0].length;

        for (let i = 0; i < entries.length; i++) {
            this.content[i] = new Array(entries[i].length);
            if (entries[i].length != dimensions) {
                throw new Error("Invalid dimenions in matrix " + entries);
            }
            for (let j = 0; j < entries[i].length; j++){
                 this.content[i][j] = entries[i][j];
            }
        }
    }

    public getDimensions() {
        return [this.content.length, this.content[0].length];
    }
}

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

    public multiplyMatrixFromLeft(matrix: Matrix) {
        let matrixDim = matrix.getDimensions();
        let output = new Array(matrixDim[1]);
        if (matrixDim[0] != this.length) {
            throw new Error("Matrix with " + matrixDim[0] + " rows can not be multiplied with vector of length " + this.length);
        }

        for (let i = 0; i < matrixDim[1]; i++) {
            let currentSum = 0;
            for (let j = 0; j < this.length; j++) {
                currentSum += this.entries[j] * matrix.content[j][i];
            }
            output[i] = currentSum;
        }
        return new Vector(output);
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