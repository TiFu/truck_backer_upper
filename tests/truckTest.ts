import {Truck, TruckException} from '../src/model/truck'
import {Point} from '../src/math'
import {expect} from 'chai'
import { suite, test, slow, timeout } from "mocha-typescript";

@suite
class TruckTest {
    private truck: Truck;

    before() {
        this.truck = new Truck(new Point(5, 5), 0, 0);
    }
    @test
    public driveStraight() {
        this.truck.nextTimeStep(0);
        expect(this.truck.getCouplingDevicePosition()).to.deep.equal(new Point(5,3));
        expect(this.truck.getTrailerEndPosition()).to.deep.equal(new Point(5,0));

        expect(this.truck.getCabTrailerAngle()).to.equal(Math.PI / 2);
        expect(this.truck.getTruckAngle()).to.equal(Math.PI / 2);
    }
    
    @test 
    lengths() {
        expect(this.truck.getTrailerLength()).to.equal(3);
        expect(this.truck.getTruckLength()).to.equal(1);
    }

    @test
    public driveLeft() {
        for (let i = 0; i < 10; i++) {
            try {
            this.truck.nextTimeStep(1);            
            } catch (e) {
                if (e instanceof TruckException) {
                    break;
                }
            }
        }
        expect(this.truck.getCouplingDevicePosition()).to.deep.equal(new Point(7.162421935274231,1.6093177159004508));
        expect(this.truck.getTrailerEndPosition()).to.deep.equal(new Point(4.937097615808898,-0.40262951829734295));

        expect(Math.abs(this.truck.getTrailerAngle() -0.7350834755962865) < 10e-9).to.be.true;
        expect(Math.abs(this.truck.getTruckAngle() -2.305879802391183) < 10e-9).to.be.true;
    }
}