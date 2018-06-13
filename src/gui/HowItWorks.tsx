import * as React from 'react'
import {Simulation} from './Simulation'
import { Car, NormalizedCar } from "../model/car";
import { Point } from "../math";
import { Dock, World } from "../model/world";
import {Emulator} from './Emulator';
import {Tab, Tabs} from 'react-bootstrap';
import {Controller} from './Controller';
import {NeuralNet} from '../neuralnet/net';
import { TrainController } from '../neuralnet/train';
import{Truck, NormalizedTruck} from '../model/truck';

export class HowItWorks extends React.Component<{}, {}> {

    public constructor(props: {}) {
        super(props)
    }

    public render() {
        return <div className="container">
            <div className="row">
                <div className="col-sm-12">
                    <h2>How it works</h2>

                    <h3>Step 1: Train Emulator</h3>

                    In the first step a neural net is used to generate an approximate
                    model of the truck/car. It simple maps state (x, y coordinates, angle relative to x-axis) 
                    plus controll signal (steering signal) to the next state. The standard
                    backpropagation algorithm is used to 

                    To improve learning speed, the inputs and outputs of the network should be
                    scaled to {"[-1, 1]"}. 

                    <h3>Step 2: Train Controller</h3>

                    The result of the second step is a controller which is capable of steering
                    the truck/car to the dock. The controller is a neural net which maps the state
                    of the object to a steering signal. 

                    Each iteration of the training process follows the same schema (compare w. figure 1):

                    <ol>
                        <li>Freeze the weights of the emulator net</li>
                        <li>Place the truck at a random position wrt to the current difficulty</li>
                        <li>Calculate the next steering signal u<sub>i</sub> with the controller</li>
                        <li>Use the actual truck to calculate the next position<sup>1</sup></li>
                        <li>Repeat steps 2 and 3 until the truck is</li>
                        <ul>
                            <li>at the dock</li>
                            <li><b>or</b> outside the simulated area (x in {"[-100, 100]"}, y in {"[-50, 50]"})</li>
                        </ul>
                        <li>Calculate the sum squared error between the final truck position and the dock</li>
                        <li>Calculate the derivative and use backpropagation to propagate the error through all emulators and controllers</li>
                        <li>Update the weights of the controller</li>
                    </ol>

                    <sup>1</sup> It's also possible to use the emulator in this step instead of the actual truck model

                    At the beginning of training the controller produces a random steering signal - therefore the truck can not 
                    be placed too far away from the dock or it might not reach the dock. Learning has to be performed stepwise 
                    - going from simple lessons to more complicated lessons with further distance from the dock and larger angles.

                    Even with these modifications the training is unstable - the training success heavily depends on the weight initialization
                    and the truck positions used in the first few lessons.
                    
                    <h2>References</h2>
                    {"// TODO: Jordan paper, Nguyen Truck and Nguyen initialization of weights, truck model, car model"}
                </div>
            </div>
        </div>
    }
}