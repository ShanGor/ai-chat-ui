import gearIcon from "../../assets/gear.png"
import successIcon from "../../assets/success.png"
import failedIcon from "../../assets/failed.png"
import runningIcon from "../../assets/running.png"

export const dagImage = {
    logo: gearIcon,
    success: successIcon,
    failed: failedIcon,
    running: runningIcon,
};

export const AlgoNode = (props) => {
    const { node } = props;
    const data = node?.getData() || {};
    const { label, status = 'default' } = data;

    return (
        <div className={`node ${status}`}>
            <img src={dagImage.logo} alt="logo" />
            <span className="label">{label}</span>
            <span className="status">
        {status === 'success' && <img src={dagImage.success} alt="success" />}
                {status === 'failed' && <img src={dagImage.failed} alt="failed" />}
                {status === 'running' && <img src={dagImage.running} alt="running" />}
      </span>
        </div>
    );
};