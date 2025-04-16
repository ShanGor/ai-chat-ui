import {Handle, Position} from "@xyflow/react";
import {dagImage} from "./AlgoNode.jsx";

export const ActionNode = ({id, data }) => {
    const { label, description, status = 'default' } = data;

    const navigateToResponse = () => {
        const position = document.getElementById(`history-pane-${id}`)
        if (!position) {
            console.info("position not exist yet!")
        }
        position?.scrollIntoView({behavior: 'smooth'})
    };

    return (
        <div className={`node ${status}`} onClick={navigateToResponse}>
            <Handle type="target" position={Position.Top} />
            <img src={dagImage.logo} alt="logo" />
            <span className="label">{label}</span>
            <span className="status">
                {status === 'success' && <img src={dagImage.success} alt="success" />}
                {status === 'failed' && <img src={dagImage.failed} alt="failed" />}
                {status === 'running' && <img src={dagImage.running} alt="running" />}
            </span>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export const StartNode = ({}) => {
    return (
        <div className={'start-node'}>
            <div style={{width:'30px', height:'30px', margin: '0 auto', borderWidth:'3px', borderColor:'#52c41a', borderStyle:'solid', borderRadius:'50%'}}></div>
            <Handle type="source" position={Position.Bottom}/>
        </div>
    );
};

export const EndNode = ({ data }) => {
    return (
        <div className={'start-node'}>
            <Handle type="target" position={Position.Top} />
            <div style={{width:'30px', height:'30px', margin: '0 auto', borderWidth:'3px', borderColor:'black', borderStyle:'solid', borderRadius:'50%'}}></div>
        </div>
    );
};