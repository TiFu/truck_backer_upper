import * as React from 'react'
import {Lesson} from '../neuralnet/lesson'
import {Grid, Row, Col} from 'react-bootstrap'
interface LessonViewProps {
    lesson: Lesson;
    performedTrainSteps: number;
    maxStepViolations: number;
}

export class LessonView extends React.Component<LessonViewProps, {}> {

    public constructor(props: LessonViewProps) {
        super(props)
    }

    private toDeg(radians: number): number {
        return radians / Math.PI * 180;
    }

    public render() {
        if (this.props.lesson == null) {
            return <div>No lesson set</div>;
        }
        return  <Grid>
                    <Row>
                        <Col xs={6} >Lesson No:</Col>
                        <Col xs={6} >{this.props.lesson.no}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Performed Train Steps</Col>
                        <Col xs={6} >{this.props.performedTrainSteps} / {this.props.lesson.samples}</Col>
                    </Row>
                    <Row>
                        <Col xs={6}>Max Step Violations</Col>
                        <Col xs={6}>{this.props.maxStepViolations}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Max Steps</Col>
                        <Col xs={6} >{this.props.lesson.maxSteps}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >X</Col>
                        <Col xs={6} >[{this.props.lesson.x.min}, {this.props.lesson.x.max}]</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Y</Col>
                        <Col xs={6} >[{this.props.lesson.y.min}, {this.props.lesson.y.max}]</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Trailer Angle</Col>
                        <Col xs={6} >[{this.toDeg(this.props.lesson.trailerAngle.min)}, {this.toDeg(this.props.lesson.trailerAngle.max)}]</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Cab Angle</Col>
                        <Col xs={6} >[{this.toDeg(this.props.lesson.cabAngle.min)}, {this.toDeg(this.props.lesson.cabAngle.max)}]</Col>
                    </Row>
                    <Row>
                        <Col xs={6} >Max Steps</Col>
                        <Col xs={6} >{this.props.lesson.maxSteps}</Col>
                    </Row>
                </Grid>
    }
}