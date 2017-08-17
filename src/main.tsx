import * as React from "react"
import * as $ from "jquery"
import {render} from "react-dom"
import Simulation from "./Simulation"
import "bootstrap/dist/css/bootstrap.min.css"

$(document).ready(() => {
    render(<Simulation />, document.getElementById("mainContainer"));
    (window as any).sim = Simulation.instance
})