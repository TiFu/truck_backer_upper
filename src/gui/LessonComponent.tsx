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
    lesson: Lesson;
}
export class LessonsComponent extends React.Component<LessonsProps, LessonsState> {

    public constructor(props: LessonsProps) {
        super(props)
        this.state = {addLesson: false, lesson: undefined};
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
        this.setState({addLesson: true, lesson: defaultLesson})
    }

    private handleAddLessonChanged(lesson: Lesson) {
        this.setState({lesson: lesson});
    }

    private handleCancelAddLesson() {
        this.setState({lesson: undefined, addLesson: false});
    }

    private handleAddLessonConfirm() {
        console.log("handling add lesson changed.");
        this.state.lesson.no += 1; // "add after" + 1 is index
        this.props.lessons.splice(this.state.lesson.no, 0, this.state.lesson);
        this.props.onChange(this.props.lessons);
        this.setState({addLesson: false, lesson: undefined});
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

    public render() {
        let lessons = this.props.lessons.map((lesson, i) => <LessonComponent editablePosition={false} key={Math.random() * 100} lesson={lesson} onChange={(lesson: Lesson) => this.onChange(i, lesson)} />)
        
        let modal = undefined;
        if (this.state.addLesson) {
            modal =      <div className="modal show" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Add Lesson</h2>
                  <button type="button" className="close" onClick={this.handleCancelAddLesson.bind(this)} data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">     
                  <LessonComponent editablePosition={true} lesson={this.state.lesson} onChange={this.handleAddLessonChanged.bind(this)} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={this.handleAddLessonConfirm.bind(this)}>Save changes</button>
                  <button type="button" className="btn btn-secondary" onClick={this.handleCancelAddLesson.bind(this)} data-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
          </div>
        }
        return <div className="container">
            <h2>Lessons</h2>
            {modal}
            <button disabled={this.state.addLesson} type="button"  onClick={this.handleAddLesson.bind(this)} className="btn btn-primary mb">Add Lesson</button>
            {lessons}
        </div>
    }
}

interface LessonProps {
    lesson: Lesson;
    onChange: (lesson: Lesson) => void;
    editablePosition: boolean;
}

class LessonComponent extends React.Component<LessonProps, {}> {
    public constructor(props: LessonProps) {
        super(props);
    }

    private handleXMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.x.min = Number.parseFloat(e.currentTarget.value);
            this.props.onChange(this.props.lesson);
        }
    }

    private handleXMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.x.max = Number.parseFloat(e.currentTarget.value);
            this.props.onChange(this.props.lesson);
        }
    }

    private handleMaxStepsChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.props.lesson.maxSteps = Number.parseInt(e.currentTarget.value);
        this.props.onChange(this.props.lesson);

    }

    private handleYMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.y.min = Number.parseFloat(e.currentTarget.value);
            this.props.onChange(this.props.lesson);
        }
    }

    private handleYMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.y.max = Number.parseFloat(e.currentTarget.value);
            this.props.onChange(this.props.lesson);
        }
    }

    private handleAngleMaxChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.angle.max = Number.parseFloat(e.currentTarget.value) / 180 * Math.PI;
            this.props.onChange(this.props.lesson);
        }
    }

    private handleAngleMinChanged(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.props.lesson instanceof CarLesson) {
            this.props.lesson.angle.min = Number.parseFloat(e.currentTarget.value) / 180 * Math.PI;
            this.props.onChange(this.props.lesson);
        }
    }

    private handleSamplesChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.props.lesson.samples = Number.parseInt(e.currentTarget.value);
        this.props.onChange(this.props.lesson);
    }

    private handleDeleteLesson() {
        console.log("Remove lesson!");
        this.props.onChange(null);
    }

    private handleLessonNoChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.props.lesson.no = Number.parseInt(e.currentTarget.value);
        this.props.onChange(this.props.lesson);
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

        let index = <div className="col-sm-2">
        <label htmlFor="a" className="pl pr">No: </label> {this.props.lesson.no}
    </div>;
        if (this.props.editablePosition) {
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

        let removeButton = <div className="row pb">
        <div className="col-sm-10">

        </div>
        <div className="col-sm-2">
            <button type="button"  onClick={this.handleDeleteLesson.bind(this)} className="btn btn-danger">Remove</button>
        </div>
    </div>
;
        if (this.props.editablePosition) {
            removeButton = undefined;
        }
        
        return <div className="form pb">
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
                    {removeButton}
                 </div>
            </div>
        </div>
    }
}