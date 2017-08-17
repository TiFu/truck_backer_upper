import {Truck, TruckException} from '../src/model/truck'
import {Point} from '../src/math'
import {expect} from 'chai'
import { suite, test, slow, timeout } from "mocha-typescript";

@suite
class TruckTest {
    private truck: Truck;

    before() {
        this.truck = new Truck(new Point(5, 5), new Point(5, 4), new Point(5, 1));
    }
    @test
    public driveStraight() {
        this.truck.nextTimeStep(0);
        expect(this.truck.couplingDevicePosition).to.deep.equal(new Point(5,3));
        expect(this.truck.trailerEndPosition).to.deep.equal(new Point(5,0));

        expect(this.truck.trailerXAngle).to.equal(Math.PI / 2);
        expect(this.truck.truckXAngle).to.equal(Math.PI / 2);
    }
    
    @test 
    lengths() {
        expect(this.truck.trailerLength).to.equal(3);
        expect(this.truck.truckLength).to.equal(1);
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
        expect(this.truck.couplingDevicePosition).to.deep.equal(new Point(6.046214828989526,2.3848171641391906));
        expect(this.truck.trailerEndPosition).to.deep.equal(new Point(4.937097615808898,-0.4026295182973429));

        expect(Math.abs(this.truck.trailerXAngle -1.192104026941941) < 10e-9).to.be.true;
        expect(Math.abs(this.truck.truckXAngle -2.9936333869959677) < 10e-9).to.be.true;
    }
}