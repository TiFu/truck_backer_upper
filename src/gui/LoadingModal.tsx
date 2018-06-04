import {Modal} from 'react-bootstrap';
import * as React from 'react'

export interface LoadingModalProps {
    headerText: string;

}
export class LoadingModal extends React.Component<LoadingModalProps, {}> {

    public constructor(props: LoadingModalProps) {
        super(props)
    }


    public render() {
        return <div>
                <Modal show={true} onHide={() => {}}>
                <Modal.Dialog>
                    <Modal.Header>
                        {this.props.headerText}
                    </Modal.Header>
                </Modal.Dialog>
                </Modal>
            </div>
    }
}