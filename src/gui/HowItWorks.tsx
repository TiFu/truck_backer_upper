import * as React from 'react'

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
                    <p>
                    In the first step a neural net is used to learn an approximate
                    model of the truck. 
                    </p>
                    
                    <b>Input</b>
                    <ul>
                        <li>(x,y) position of the end of the trailer</li>
                        <li>Trailer Angle, relative to the x-Axis</li>
                        <li>Tractor Angle, relative to the x-Axis</li>
                        <li>Steering Signal</li>
                    </ul>
                    
                    <b>Output</b>
                    <ul>
                        <li>(x,y) position of the end of the trailer</li>
                        <li>Trailer Angle, relative to the x-Axis</li>
                        <li>Tractor Angle, relative to the x-Axis</li>
                    </ul>

                    The backpropagation algorithm is used to train the network.
                    All inputs and outputs are scaled to {"[-1, 1]"} in order to 
                    reduce the network error and improve the learning speed.


                    <h3>Step 2: Train Controller</h3>

                    The result of the second step is a controller which is capable of steering
                    the truck to the dock. The controller is a neural net which 
                    maps the state of the truck to an appropriate steering signal. 
                    <br/>
                    <figure className="figure">
                        <img src="./controller.svg" className="col-12 figure-img " />
                        <figcaption className="figure-caption"><big><b>Figure 1</b> Forward Pass</big></figcaption>
                    </figure>
                    <br /><br />

                    Each iteration of the training process follows the same schema (see figure 1):
                    <ol>
                        <li>Freeze the weights of the emulator net</li>
                        <li>Place the truck at a random position wrt to the current difficulty<sup>3</sup></li>
                        <li>Forward Pass</li>
                        <ol>
                            <li>Calculate the next steering signal u<sub>i</sub> with the controller</li>
                            <li>Use the actual truck to calculate the next position<sup>1</sup></li>
                            <li>Repeat steps 1 and 2 until the truck is at the dock or a maximum number of steps $k$ were performed)</li>
                        </ol>
                        <li>Backward Pass</li>
                        <ol>
                            <li>If the maximum number of steps was reached, do not perform backpropagation.</li>
                            <li>Calculate the sum squared error between the final truck position and the dock<sup>4</sup></li>
                            <li>Calculate the derivative of the error and use backpropagation through time (BPTT) to propagate the error through all emulators and controllers.</li>
                            <li>Update the weights of the controller</li>
                        </ol>
                    </ol>

                    <sup>1</sup> It's also possible to use the emulator in this step instead of the actual truck model<br />
                    <sup>2</sup> The emulator network in the backward pass can also be replaced by the Jacobi Matrix of the truck model.<br />
                    <sup>3</sup>At the beginning of training the controller produces a random steering signal - therefore the truck can not 
                        be placed too far away from the dock or it might not reach the dock. Learning has to be performed stepwise 
                        - going from simple lessons to more complicated lessons with further distance from the dock and larger angles.<br />
                    <sup>4</sup>The error is the squared distance between the (x,y) coordinate of the trailer and the dock, and between the trailer angle and 0 degrees.

                    <h2>References</h2>

                    <p><b>Basics Distal Teacher: </b>Jordan, Michael I., and David E. Rumelhart. "Forward models: Supervised learning with a distal teacher." Cognitive science 16.3 (1992): 307-354.</p>

                    <p><b>Truck Backer-Upper:</b> Nguyen, Derrick, and Bernard Widrow. "The truck backer-upper: An example of self-learning in neural networks." Advanced neural computers. 1990. 11-19.</p>

                    <p><b>Two Layer Weight Initialization: </b>Nguyen, Derrick, and Bernard Widrow. "Improving the learning speed of 2-layer neural networks by choosing initial values of the adaptive weights." Neural Networks, 1990., 1990 IJCNN International Joint Conference on. IEEE, 1990.</p>

                    <p><b>Truck Model: </b> Schoenauer, Marc, and Edmund Ronald. "Neuro-genetic truck backer-upper controller." Evolutionary Computation, 1994. IEEE World Congress on Computational Intelligence., Proceedings of the First IEEE Conference on. IEEE, 1994.</p>

                </div>
            </div>
        </div>
    }
}