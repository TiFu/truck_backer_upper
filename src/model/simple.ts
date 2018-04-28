import {HasState, Limitable} from './world'
import { Vector } from '../neuralnet/math';
import { StraightLine } from '../math';

export class Simple implements HasState {
    public x: number;
    private positionIndex: number = 0;
    private startPositions: number[] = [-2]


    public getStateDescription() {
        return [ "x"];
    }
    public getStateVector(): Vector {
        return new Vector([this.x])
    }

    public nextState(controllerSignal: number): boolean {
        this.drive(controllerSignal);
        return this.continue();
    }

    private drive(controllerSignal: number) {
        this.x = Math.tanh(this.x + controllerSignal);
    }
    private continue(): boolean {
        return Math.abs(this.x) > 10e-5;
    }

    public getOriginalState() {
        return this.getStateVector();
    }
    // randomize in [-3, 3]
    public randomizePosition() {
        if (this.positionIndex >= this.startPositions.length) {
            this.x = Math.random() * 6 - 3;
        } else {
            this.x = this.startPositions[this.positionIndex++];
        }
    }
}
