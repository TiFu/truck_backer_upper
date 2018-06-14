import * as React from 'react'
import {Simulation} from './Simulation'
import { Car } from "../model/car";
import { Truck } from '../model/truck';

import { Point } from "../math";
import { Dock } from "../model/world";
import {Emulator} from './Emulator';
import {Tab, Tabs} from 'react-bootstrap';
import {Controller} from './Controller';
import {Lesson, CarLesson, TruckLesson, Range} from '../neuralnet/lesson';
import { SGD, SGDNesterovMomentum } from '../neuralnet/optimizers';

export interface LessonsProps {
    object: Car | Truck;
    lessons: Lesson[];
    onChange: (lessons: Lesson[]) => void;
}

export interface LessonsState {
    addLesson: boolean;
    editLesson: boolean;
    lessonIndex: number;
    lesson: Lesson;
}
export class LessonsComponent extends React.Component<LessonsProps, LessonsState> {

    public constructor(props: LessonsProps) {
        super(props)
        this.state = {addLesson: false, lessonIndex: -1,  lesson: undefined, editLesson: false};
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }

    private toRad(degree: number): number {
        return degree / 180 * Math.PI;
    }

    public handleAddLesson() {
        let defaultLesson = undefined;
        if (this.props.object instanceof Car) {
            defaultLesson = new CarLesson(this.props.object, this.props.lessons.length - 1, 10000, 52, () => new SGDNesterovMomentum(0.75, 0.9), new Range(1, 4), new Range(1, 2), new Range(-Math.PI, Math.PI));
        } else if (this.props.object instanceof Truck) {
            defaultLesson = new TruckLesson(this.props.object, this.props.lessons.length - 1, 10000, () => new SGDNesterovMomentum(0.75, 0.9), new Range(1, 4), new Range(-2, 2), new Range(-0.5 * Math.PI, Math.PI), new Range(-0.5*Math.PI, 0.5*Math.PI), 52);
        } else {
            return;
        }
        this.setState({addLesson: true, lessonIndex: -1, lesson: defaultLesson})
    }

    private handleAddLessonConfirm(lesson: Lesson) {
        console.log("handling add lesson changed.");
        lesson.no += 1; // "add after" + 1 is index
        this.props.lessons.splice(lesson.no, 0, lesson);
        this.props.onChange(this.props.lessons);
        this.setState({addLesson: false, lesson: undefined, lessonIndex: -1});
    }

    private onChange(index: number, lesson: Lesson) {
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
        this.props.onChange(lessons);
    }

    private editLesson(index: number, lesson: Lesson) {
        this.setState({editLesson: true, lesson: lesson, lessonIndex: index});
    }

    private onLessonSave(lesson: Lesson) {
        if (this.state.editLesson) {
            this.props.lessons[this.state.lessonIndex] = lesson;
            this.props.onChange(this.props.lessons);
            this.setState({editLesson: false, lessonIndex: -1, lesson: null});
        } else if (this.state.addLesson) {
            this.handleAddLessonConfirm(lesson);
        }
    }

    private onLessonCancel() {
        this.setState({editLesson: false, addLesson: false, lesson: undefined});
    }

    public render() {
        let columns = [];
        columns.push(<th key="no" scope="col">No.</th>);
        columns.push(<th key="samples" scope="col">Samples</th>)
        columns.push(<th key="max_stesp" scope="col">Max Steps</th>);

        if (this.props.lessons[0] instanceof CarLesson) {
            columns.push(<th key="x" scope="col">x-Range</th>);
            columns.push(<th key="y" scope="col">y-Range</th>);
            columns.push(<th key="angle" scope="col">Angle</th>);
        } else if (this.props.lessons[0] instanceof TruckLesson) {
            // TODO: implement truck lesson
            // TODO: make CarLEssonComponent & TruckLessonComponent separaet components
        }
        columns.push(<th key={"buttons"}></th>);

        let lessons = this.props.lessons.map((l ,i) => {
            let additionalProperties = [
                <td key={"no_" + Math.random()}>{l.no}</td>,
                <td key={"samples_" + Math.random()}>{l.samples.toString()}</td>,
                <td key={"maxSteps" + Math.random()}>{Math.floor(l.maxSteps)}</td>
            ];
    
            if (l instanceof CarLesson) {
                additionalProperties.push(
                    <td key={"x_" + Math.random()}> [ {l.x.min.toFixed(2).toString()}, {l.x.max.toFixed(2).toString()} ]</td>);
                additionalProperties.push(
                    <td key={"y_" + Math.random()}> [ {l.y.min.toFixed(2).toString()}, {l.y.max.toFixed(2).toString()} ]</td>);
                additionalProperties.push(
                    <td key={"angle_" + Math.random()}> [ {l.angle.min.toFixed(2).toString()}, {l.angle.max.toFixed(2).toString()} ]</td>);
            } else if (l instanceof TruckLesson) {
                // TODO: implement truck lesson
            }
    
            // TODO: replace onChange with null with onDeleteLesson(index);
            additionalProperties.push(<td key={"buttons_" + Math.random()} className="align-right">
                    <button type="button" onClick={() => this.editLesson(i, l)} disabled={this.state.editLesson || this.state.addLesson} className="btn btn-warning mr"><span className="fas fa-edit"></span></button>
                    <button type="button"  onClick={() => this.onChange(i, null)} disabled={this.state.editLesson || this.state.addLesson} className="btn btn-danger"><span className="fas fa-trash-alt"></span></button>
                </td>);
            
            return <tr key={Math.random()}>
                    {additionalProperties}
            </tr>
        })

        let modal = undefined;
        if (this.state.addLesson || this.state.editLesson) {
            modal = <LessonEditComponent edit={this.state.editLesson} lesson={this.state.lesson} onSave={this.onLessonSave.bind(this)} onCancel={this.onLessonCancel.bind(this)} />
        }
        return <div className="container">
            <h2>Lessons</h2>
            {modal}
            <button disabled={this.state.addLesson || this.state.editLesson} type="button"  onClick={this.handleAddLesson.bind(this)} className="btn btn-primary mb">Add Lesson</button>
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
    lesson: Lesson;
    edit: boolean;
    onSave: (lesson: Lesson) => void;
    onCancel: () => void;
}

interface LessonState {
    no: number;
    samples: number;
    maxSteps: number;
    x: Range;
    y: Range;
    angle: Range;
}

class LessonEditComponent extends React.Component<LessonProps, LessonState> {
    public constructor(props: LessonProps) {
        super(props);
        let x = new Range(0.0, 0.0);
        let y = new Range(0.0, 0.0);
        let angle = new Range(0.0, 0.0);
        if (this.props.lesson instanceof CarLesson) {
            x.min = this.props.lesson.x.min;
            x.max = this.props.lesson.x.max;
            y.min = this.props.lesson.y.min;
            y.max = this.props.lesson.y.max;
            angle.min = this.props.lesson.angle.min;
            angle.max = this.props.lesson.angle.max;
        }

        this.state = {
            no: this.props.lesson.no,
            samples: this.props.lesson.samples,
            maxSteps: this.props.lesson.maxSteps,
            x: x,
            y: y,
            angle: angle
        };
    }

    private handleXMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
            this.state.x.min = Number.parseFloat(e.currentTarget.value);
            this.setState({ x: this.state.x});
    }

    private handleXMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.x.max = Number.parseFloat(e.currentTarget.value);
        this.setState({ x: this.state.x});
    }

    private handleMaxStepsChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let maxSteps = Number.parseInt(e.currentTarget.value);
        this.setState({ maxSteps: maxSteps});
    }

    private handleYMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.y.min = Number.parseFloat(e.currentTarget.value);
        this.setState({ y: this.state.y});
    }

    private handleYMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.y.max = Number.parseFloat(e.currentTarget.value);
        this.setState({ y: this.state.x});
    }

    private handleAngleMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.angle.max= Number.parseFloat(e.currentTarget.value);
        this.setState({ angle: this.state.angle});
    }

    private handleAngleMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.state.angle.min= Number.parseFloat(e.currentTarget.value);
        this.setState({ angle: this.state.angle});
    }

    private handleSamplesChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let samples = Number.parseInt(e.currentTarget.value);
        this.setState({ samples: samples});
    }

    private handleLessonNoChanged(e: React.ChangeEvent<HTMLInputElement>) {
        let no = Number.parseInt(e.currentTarget.value);
        this.setState({ no: this.state.no});
    }

    private handleSave() {
        this.props.lesson.no = this.state.no;
        this.props.lesson.samples = this.state.samples;
        this.props.lesson.maxSteps = this.state.maxSteps;
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.x = this.state.x;
            this.props.lesson.y = this.state.y;
            this.props.lesson.angle = this.state.angle;
        }
        this.props.onSave(this.props.lesson);
    }

    private handleCancel() {
        this.props.onCancel();
    }

    public render() {
        let additionalProperties = [];
        if (this.props.lesson instanceof CarLesson) {
            additionalProperties.push(
                <div className="row pb" key={"x"}>
                <div className="col-sm-4">
                    <label htmlFor="maxSteps" className="pl pr">x-Range: </label>
                </div>
                <div className="col-sm-8 form-inline">
                    <input defaultValue={this.props.lesson.x.min.toFixed(2).toString()} id="x_min" type="text" onBlur={this.handleXMinChanged.bind(this)} className="form-control"/>
                    <span className="pl pr">-</span> 
                    <input defaultValue={this.props.lesson.x.max.toFixed(2).toString()} id="x_max" type="text" onBlur={this.handleXMaxChanged.bind(this)} className="form-control"/>
                    <span className="pl pr"> </span> 
                    Car Lengths
                </div>
            </div>
            );
            additionalProperties.push(
                <div className="row pb" key={"y"}>
                <div className="col-sm-4">
                    <label htmlFor="maxSteps" className="pl pr">y-Range: </label>
                </div>
                <div className="col-sm-8 form-inline">
                    <input defaultValue={this.props.lesson.y.min.toFixed(2).toString()} id="y_min" type="text" onBlur={this.handleYMinChanged.bind(this)} className="form-control"/>
                    <span className="pl pr">-</span> 
                    <input defaultValue={this.props.lesson.y.max.toFixed(2).toString()} id="y_max" type="text" onBlur={this.handleYMaxChanged.bind(this)} className="form-control"/>
                    <span className="pl pr"> </span> 
                    Car Lengths
                </div>
            </div>
            );
            additionalProperties.push(
                <div className="row pb" key={"angle"}>
                <div className="col-sm-4">
                    <label htmlFor="maxSteps" className="pl pr">Angle-Range: </label>
                </div>
                <div className="col-sm-8 form-inline">
                    <input defaultValue={(this.props.lesson.angle.min * 180 / Math.PI).toFixed(2).toString()} id="angle_min" type="text" onBlur={this.handleAngleMinChanged.bind(this)} className="form-control"/>
                    <span className="pl pr">-</span> 
                    <input defaultValue={(this.props.lesson.angle.max * 180 / Math.PI).toFixed(2).toString()} id="angle_max" type="text" onBlur={this.handleAngleMaxChanged.bind(this)} className="form-control"/>
                    <span className="pl pr"> </span> 
                    degrees
                </div>
            </div>
            );
        } else if (this.props.lesson instanceof TruckLesson) {

        }

        let index = undefined;
        if (this.props.edit) {
            <div className="row pb">
                <div className="col-sm-10">
                    <div className="col-sm-4">
                        <label htmlFor="a" className="pl pr">No: </label>
                    </div>
                    <div className="col-sm-8"> 
                        {this.props.lesson.no}
                    </div>
                </div>
            </div>;
        } else {
            index = <div className="row pb">
                <div className="col-sm-10">
                    <div className="col-sm-4">
                        <label htmlFor="a" className="pl pr">Add after: </label>
                    </div>
                    <div className="col-sm-8"> 
                        <input defaultValue={this.props.lesson.no.toString()} id="no" type="text" onBlur={this.handleLessonNoChanged.bind(this)} className="form-control"/>
                    </div>
                </div>
            </div>;
        }
        
        let lessonEditComponent = <div className="form pb">
            <div className="row pb">
                {index}
                 <div className="col-sm-10">
                    <div className="row pb">
                        <div className="col-sm-4">
                            <label htmlFor="samples" className="pl pr">Samples:</label>
                        </div>
                        <div className="col-sm-8">
                            <input defaultValue={this.props.lesson.samples.toString()} id="samples" type="text" onBlur={this.handleSamplesChanged.bind(this)} className="form-control"/>
                        </div>
                    </div>
                    <div className="row pb">
                        <div className="col-sm-4">
                            <label htmlFor="maxSteps" className="pl pr">Max Steps:</label>
                        </div>
                        <div className="col-sm-8">
                            <input defaultValue={Math.floor(this.props.lesson.maxSteps).toString()} id="maxSteps" type="text" onBlur={this.handleMaxStepsChanged.bind(this)} className="form-control"/>
                        </div>
                    </div>
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