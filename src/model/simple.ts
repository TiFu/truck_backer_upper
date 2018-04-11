import {HasState, Limitable} from './world'
import { Vector } from '../neuralnet/math';
import { StraightLine } from '../math';

export class Simple implements HasState {
    private x: number;

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
        return this.x > 10e-4;
    }

    // randomize in [-3, 3]
    public randomizePosition() {
        this.x = Math.random() * 6 - 3;
    }
}