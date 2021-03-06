import * as React from 'react'
import { Truck } from '../model/truck';

import { toDeg } from "../math";
import { TruckLesson, Range } from '../neuralnet/lesson';
import { SGD, SGDNesterovMomentum } from '../neuralnet/optimizers';
import { Optimizer } from '../neuralnet/optimizers';
import {toRad} from '../math'
export interface LessonsProps {
    object: Truck;
    lessons: TruckLesson[];
    activeLessonIndex: number;
    onChange: (lessons: TruckLesson[]) => void;
    onSelectRow: (lessonIndex: number) => void;
    disabled: boolean;
}

export interface LessonsState {
    addLesson: boolean;
    editLesson: boolean;
    lessonIndex: number;
    lesson: TruckLesson | undefined;
}
export class LessonsComponent extends React.Component<LessonsProps, LessonsState> {

    public constructor(props: LessonsProps) {
        super(props)
        this.state = { addLesson: false, lessonIndex: -1, lesson: undefined, editLesson: false };
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }


    public handleAddLesson() {
        let defaultLesson = new TruckLesson(this.props.object,
            this.props.lessons.length - 1, 10000,
            () => new SGDNesterovMomentum(0.75, 0.9),
            new Range(1, 4),
            new Range(-2, 2),
            new Range(-0.5 * Math.PI, Math.PI),
            new Range(-0.5 * Math.PI, 0.5 * Math.PI), 52);

        this.setState({ addLesson: true, lessonIndex: -1, lesson: defaultLesson })
    }

    private handleAddLessonConfirm(lesson: TruckLesson) {
        lesson.no += 1; // "add after" + 1 is index
        this.props.lessons.splice(lesson.no, 0, lesson);
        this.props.onChange(this.props.lessons);
        this.setState({ addLesson: false, lesson: undefined, lessonIndex: -1 });
    }

    private onChange(e: React.MouseEvent<HTMLElement>, index: number, lesson: TruckLesson | null) {
        let lessons = this.props.lessons;
        if (lesson == null) {
            lessons.splice(index, 1);
            // recalculate lesson numbers
            for (let i = 0; i < lessons.length; i++) {
                lessons[i].no = i;
            }
        } else {
            lessons[index] = lesson;
        }
        e.stopPropagation();
        this.props.onChange(lessons);
    }

    private editLesson(e: React.MouseEvent<HTMLElement>, index: number, lesson: TruckLesson) {
        e.stopPropagation();
        this.setState({ editLesson: true, lesson: lesson, lessonIndex: index });
    }

    private onLessonSave(lesson: TruckLesson) {
        if (this.state.editLesson) {
            this.props.lessons[this.state.lessonIndex] = lesson;
            this.props.onChange(this.props.lessons);
            this.setState({ editLesson: false, lessonIndex: -1, lesson: undefined });
        } else if (this.state.addLesson) {
            this.handleAddLessonConfirm(lesson);
        }
    }

    private onLessonCancel() {
        this.setState({ editLesson: false, addLesson: false, lesson: undefined });
    }

    private getColHeader(name: string, headerCount: number) {
        return <th key={name.replace(/ /g, "_").replace(/\./g, "").toLowerCase()} scope="col">{name}</th>
    }

    private getRow(name: string, range: Range, angle: boolean = false) {
        let angleFunction = (e: number) => e;
        if (angle) {
            angleFunction = this.toDeg;
        }
        return <td key={name + "_" + Math.random()}> [ {angleFunction(range.min).toFixed(2).toString()}, {angleFunction(range.max).toFixed(2).toString()} ]</td>
    }

    public render() {
        let colHeaders = ["No.", "Samples", "Max Steps", "Optimizer"]
        colHeaders.push("x-Range", "y-Range", "Cabin Angle-Range", "Trailer Angle-Range");

        let columns = [];
        for (let header of colHeaders) {
            columns.push(this.getColHeader(header, colHeaders.length));
        }
        columns.push(<th key={"buttons"}></th>);

        let lessons = this.props.lessons.map((l, i) => {
            let additionalProperties = [
                <td key={"no_" + Math.random()}>{l.no}</td>,
                <td key={"samples_" + Math.random()}>{l.samples.toString()}</td>,
                <td key={"maxSteps" + Math.random()}>{Math.floor(l.maxSteps)}</td>
            ];

            let optimizer = l.optimizer();
            let params = undefined;
            let br = undefined;
            if (optimizer instanceof SGD) {
                params = "learningRate = " + optimizer.learningRate.toString();
            } else if (optimizer instanceof SGDNesterovMomentum) {
                params = "learningRate = " + optimizer.learningRate + ", momentum = " + optimizer.momentum;
                br = <br />
            }
            additionalProperties.push(
                <td key={"optimizer_" + Math.random()}>{optimizer.getName()}({br} {params} )</td>
            );

            additionalProperties.push(
                this.getRow("x", l.x),
                this.getRow("y", l.y),
                this.getRow("cabin_angle", l.cabAngle, true),
                this.getRow("trailer_angle", l.trailerAngle, true),
            );

            additionalProperties.push(<td key={"buttons_" + Math.random()} className="align-right">
                <button type="button" onClick={(e) => this.editLesson(e, i, l)} disabled={this.state.editLesson || this.state.addLesson || this.props.disabled} className="btn btn-warning mr"><span className="fas fa-edit"></span></button>
                <button type="button" onClick={(e) => this.onChange(e, i, null)} disabled={this.state.editLesson || this.state.addLesson || this.props.disabled} className="btn btn-danger"><span className="fas fa-trash-alt"></span></button>
            </td>);

            let active = this.props.activeLessonIndex == i ? "table-primary" : "";
            return <tr key={Math.random()} onClick={() => this.props.onSelectRow(i)} className={active}>
                {additionalProperties}
            </tr>
        })

        let modal = undefined;
        if ((this.state.addLesson || this.state.editLesson) && this.state.lesson !== undefined) {
            modal = <LessonEditComponent lessonCount={this.props.lessons.length} edit={this.state.editLesson} lesson={this.state.lesson} onSave={this.onLessonSave.bind(this)} onCancel={this.onLessonCancel.bind(this)} />
        }
        return <div className="container">
            <h2>Lessons</h2>
            {modal}
            <div className="alert alert-primary">
                Click on a row to select a lesson and use it for training. The training
                algorithm will automatically switch to the next lesson after <i>samples</i> steps.
            </div>
            <button disabled={this.state.addLesson || this.state.editLesson || this.props.disabled} type="button" onClick={this.handleAddLesson.bind(this)} className="btn btn-primary mb">Add Lesson</button>
            <table className="table table-hover">
                <thead>
                    <tr>
                        {columns}
                    </tr>
                </thead>
                <tbody>
                    {lessons}
                </tbody>
            </table>
        </div>
    }
}

interface LessonProps {
    lesson: TruckLesson;
    edit: boolean;
    onSave: (lesson: TruckLesson) => void;
    onCancel: () => void;
    lessonCount: number;
}

interface LessonState {
    no: number;
    samples: number;
    maxSteps: number;
    x: Range;
    y: Range;
    angle: Range;
    trailerAngle: Range;
    cabinAngle: Range;
    optimizer: Optimizer;
    optimizers: { [key: string]: Optimizer };
}

// TODO: this should be solved by inheritance
class LessonEditComponent extends React.Component<LessonProps, LessonState> {
    public constructor(props: LessonProps) {
        super(props);
        let x = new Range(0.0, 0.0);
        let y = new Range(0.0, 0.0);
        let angle = new Range(0.0, 0.0);
        let cabAngle = new Range(0.0, 0.0);
        let trailerAngle = new Range(0.0, 0.0);

        x.min = this.props.lesson.x.min;
        x.max = this.props.lesson.x.max;
        y.min = this.props.lesson.y.min;
        y.max = this.props.lesson.y.max;

        cabAngle.min = toDeg(this.props.lesson.cabAngle.min);
        cabAngle.max = toDeg(this.props.lesson.cabAngle.max);
        trailerAngle.min = toDeg(this.props.lesson.trailerAngle.min);
        trailerAngle.max = toDeg(this.props.lesson.trailerAngle.max);

        let optimizers: any = {
        }
        let sgd = new SGD(0.5);
        let sgdNesterov = new SGDNesterovMomentum(1, 0.9);
        optimizers[sgd.getName()] = sgd;
        optimizers[sgdNesterov.getName()] = sgdNesterov;

        this.state = {
            no: this.props.lesson.no,
            samples: this.props.lesson.samples,
            maxSteps: this.props.lesson.maxSteps,
            x: x,
            y: y,
            angle: angle,
            cabinAngle: cabAngle,
            trailerAngle: trailerAngle,
            optimizer: this.props.lesson.optimizer(),
            optimizers: optimizers
        };
    }

    private handleXMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.x.min = Math.min(this.state.x.max, Number.parseFloat(e.currentTarget.value));
        console.log("Changed x min to " + this.state.x.min);
        this.setState({ x: this.state.x });
    }

    private handleXMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.x.max = Math.max(this.state.x.min, Number.parseFloat(e.currentTarget.value));
        this.setState({ x: this.state.x });
    }

    private handleMaxStepsChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let maxSteps = Math.max(Number.parseInt(e.currentTarget.value), 1);
        this.setState({ maxSteps: maxSteps });
    }

    private handleYMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.y.min = Math.min(this.state.y.max, Number.parseFloat(e.currentTarget.value));
        this.setState({ y: this.state.y });
    }

    private handleYMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.y.max = Math.max(this.state.y.min, Number.parseFloat(e.currentTarget.value));
        this.setState({ y: this.state.x });
    }

    private handleTrailerAngleMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.trailerAngle.min = Math.min(this.state.trailerAngle.max, Number.parseFloat(e.currentTarget.value));
        this.setState({ trailerAngle: this.state.trailerAngle });
    }

    private handleTrailerAngleMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.trailerAngle.max = Math.max(this.state.trailerAngle.min, Number.parseFloat(e.currentTarget.value));
        this.setState({ trailerAngle: this.state.trailerAngle });
    }

    private handleCabinAngleMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.cabinAngle.min = Math.min(this.state.cabinAngle.max, Number.parseFloat(e.currentTarget.value));
        this.setState({ cabinAngle: this.state.cabinAngle });
    }

    private handleCabinAngleMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.cabinAngle.max = Math.max(this.state.cabinAngle.min, Number.parseFloat(e.currentTarget.value));
        this.setState({ cabinAngle: this.state.cabinAngle });
    }

    private handleSamplesChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let samples = Math.max(1, Number.parseInt(e.currentTarget.value));
        this.setState({ samples: samples });
    }

    private handleLessonNoChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let no = Math.min(Math.max(-1, Number.parseInt(e.currentTarget.value)), this.props.lessonCount - 1);
        this.setState({ no: no });
    }


    private handleSave() {
        this.props.lesson.no = this.state.no;
        this.props.lesson.samples = this.state.samples;
        this.props.lesson.maxSteps = this.state.maxSteps;
        let optimizer = this.state.optimizer
        if (optimizer instanceof SGD) {
            this.props.lesson.optimizer = () => new SGD((optimizer as SGD).learningRate);
        } else if (optimizer instanceof SGDNesterovMomentum) {
            this.props.lesson.optimizer = () => new SGDNesterovMomentum((optimizer as SGDNesterovMomentum).learningRate, (optimizer as SGDNesterovMomentum).momentum);
        }

        this.props.lesson.x.min = this.state.x.min;
        this.props.lesson.x.max = this.state.x.max;
        this.props.lesson.y.min = this.state.y.min;
        this.props.lesson.y.max = this.state.y.max;
        this.props.lesson.cabAngle = this.state.cabinAngle.getScaled(Math.PI / 180);
        this.props.lesson.trailerAngle = this.state.trailerAngle.getScaled(Math.PI / 180);

        this.props.onSave(this.props.lesson);
    }

    private handleCancel() {
        this.props.onCancel();
    }

    private handleOptimizerPropertyChanged(index: number, property: any) {
        let sampleOptimizer = this.state.optimizer;

        if (sampleOptimizer instanceof SGD) {
            if (index === 0) {
                let lr = Number.parseFloat(property.currentTarget.value);
                sampleOptimizer.learningRate = lr;
            }
        } else if (sampleOptimizer instanceof SGDNesterovMomentum) {
            if (index === 0) {
                let lr = Number.parseFloat(property.currentTarget.value)
                sampleOptimizer.learningRate = lr;
            } else if (index === 1) {
                let momentum = Number.parseFloat(property.currentTarget.value)
                sampleOptimizer.momentum = momentum;
            }
        }
        this.setState({ optimizer: sampleOptimizer });
    }

    private handleOptimizerChanged(e: React.ChangeEvent<HTMLSelectElement>) {
        let optimizer = this.state.optimizers[e.currentTarget.value];
        this.setState({ optimizer: optimizer });
    }

    private getOptimizerEditProperty(optimizer: Optimizer) {
        let optimizerProps = undefined;
        if (optimizer instanceof SGD) {
            optimizerProps = [
                <div key="learning_rate2" className="row pb">
                    <div className="col-sm-4 pt">
                        <label htmlFor="learningRate" className="pl pr">Learning Rate:</label>
                    </div>
                    <div className="col-sm-8">
                        <input key={"lr_" + Math.random()} defaultValue={optimizer.learningRate.toString()} id="learningRate" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(0, e)} className="form-control" />
                    </div>
                </div>
            ]
        } else if (optimizer instanceof SGDNesterovMomentum) {
            optimizerProps = [<div key="learning_rate" className="row pb">
                <div className="col-sm-4 pt">
                    <label htmlFor="learningRate" className="pl pr">Learning Rate:</label>
                </div>
                <div className="col-sm-8">
                    <input key={"lr_" + Math.random()} defaultValue={optimizer.learningRate.toString()} id="learningRate" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(0, e)} className="form-control" />
                </div>
            </div>,

            <div key="momentum" className="row pb">
                <div className="col-sm-4 pt">
                    <label htmlFor="momentum" className="pl pr">Momentum:</label>
                </div>
                <div className="col-sm-8">
                    <input key={"momentum_" + optimizer.momentum.toString()} defaultValue={optimizer.momentum.toString()} id="momentum" type="text" onBlur={(e) => this.handleOptimizerPropertyChanged(1, e)} className="form-control" />
                </div>
            </div>
            ]
        }

        let optimizers = [];
        let selectedOptimizer = this.state.optimizer.getName();
        for (let optimizer in this.state.optimizers) {
            optimizers.push(<option key={optimizer} value={optimizer}>{optimizer}</option>);
        }

        let optimizerSelect = <select defaultValue={selectedOptimizer} className="select form-control"
            onChange={this.handleOptimizerChanged.bind(this)}>
            {optimizers}
        </select>


        return <div className="row pb">
            <div className="col-sm-4 pt">
                <label htmlFor="optimizer" className="pl pr">Optimizer: </label>
            </div>
            <div className="col-sm-8 pt">
                <div className="row pb">
                    <div className="col-sm-4 pt">
                        <label htmlFor="optimizer_method" className="pl pr">Method: </label>
                    </div>
                    <div className="col-sm-8 pt">
                        {optimizerSelect}
                    </div>
                </div>
                {optimizerProps}
            </div>
        </div>
    }
    // TODO: mark area of current lesson in simulation?

    public getEditFor(name: string, range: Range, minChanged: (e: React.ChangeEvent<HTMLInputElement>) => void, maxChanged: (e: React.ChangeEvent<HTMLInputElement>) => void) {
        return <div className="row pb" key={name}>
            <div className="col-sm-4">
                <label htmlFor="maxSteps" className="pl pr">{name}: </label>
            </div>
            <div className="col-sm-8 form-inline">
                <input key={name + Math.random()} defaultValue={range.min.toFixed(2).toString()} id={name + "_min"} type="text" onBlur={minChanged.bind(this)} className="form-control" />
                <span className="pl pr">-</span>
                <input key={name + Math.random()} defaultValue={range.max.toFixed(2).toString()} id={name + "_max"} type="text" onBlur={maxChanged.bind(this)} className="form-control" />
                <span className="pl pr"> </span>
            </div>
        </div>

    }

    public render() {
        let additionalProperties = [];
        additionalProperties.push(this.getEditFor("x-Range", this.state.x, this.handleXMinChanged, this.handleXMaxChanged));
        additionalProperties.push(this.getEditFor("y-Range", this.state.y, this.handleYMinChanged, this.handleYMaxChanged));
        additionalProperties.push(this.getEditFor("Trailer Angle-Range", this.state.trailerAngle, this.handleTrailerAngleMinChanged, this.handleTrailerAngleMaxChanged));
        additionalProperties.push(this.getEditFor("Cabin Angle-Range", this.state.cabinAngle, this.handleCabinAngleMinChanged, this.handleCabinAngleMaxChanged));

        let index = undefined;
        if (this.props.edit) {
            <div className="col-sm-12">
                <div className="row pb">
                    <div className="col-sm-4">
                        <label htmlFor="a" className="pl pr">No: </label>
                    </div>
                    <div className="col-sm-8">
                        {this.props.lesson.no}
                    </div>
                </div>
            </div>
        } else {
            index = <div className="col-sm-12">
                <div className="row pb">
                    <div className="col-sm-4">
                        <label htmlFor="a" className="pl pr">Add after (-1 to add as first lesson): </label>
                    </div>
                    <div className="col-sm-8">
                        <input key={"lesson_no_" + Math.random()} defaultValue={this.state.no.toString()} id="no" type="text" onBlur={this.handleLessonNoChanged.bind(this)} className="form-control" />
                    </div>
                </div>
            </div>
        }

        let lessonEditComponent = <div className="form pb">
            <div className="row pb">
                {index}
                <div className="col-sm-12">
                    <div className="row pb">
                        <div className="col-sm-4">
                            <label htmlFor="samples" className="pl pr">Samples:</label>
                        </div>
                        <div className="col-sm-8">
                            <input key={"samples_" + Math.random()} defaultValue={this.state.samples.toString()} id="samples" type="text" onBlur={this.handleSamplesChanged.bind(this)} className="form-control" />
                        </div>
                    </div>
                    <div className="row pb">
                        <div className="col-sm-4">
                            <label htmlFor="maxSteps" className="pl pr">Max Steps:</label>
                        </div>
                        <div className="col-sm-8">
                            <input key={"max_steps_" + Math.random()} defaultValue={Math.floor(this.state.maxSteps).toString()} id="maxSteps" type="text" onBlur={this.handleMaxStepsChanged.bind(this)} className="form-control" />
                        </div>
                    </div>
                    {this.getOptimizerEditProperty(this.state.optimizer)}
                    {additionalProperties}
                </div>
            </div>
        </div>


        return <div className="modal show" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Lesson Configuration</h2>
                        <button type="button" className="close" onClick={this.handleCancel.bind(this)} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        {lessonEditComponent}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={this.handleSave.bind(this)}>Save changes</button>
                        <button type="button" className="btn btn-secondary" onClick={this.handleCancel.bind(this)} data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    }
}