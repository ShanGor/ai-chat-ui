import {
    ReactFlow,
    Position,
    useReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState, EdgeLabelRenderer, BaseEdge, getBezierPath, Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {useEffect} from "react";
import {getLayoutedElements} from "./ReactFlowUtil.jsx";
import {insertCss} from "insert-css";
import {dagImage} from "./AlgoNode.jsx";

const nodeWidth = 180;
const nodeHeight = 36;

// 自定义边组件
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature }) => {
    const reactFlow = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature,
    });
    const edge = reactFlow.getEdge(id)
    const label = edge?.label;

    return (
        <>
            <BaseEdge id={id} path={edgePath}/>
            <EdgeLabelRenderer>
                <span
                    style={{
                        position: 'absolute',
                        fontSize: '0.8rem',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan">
                    {label}
                </span>
            </EdgeLabelRenderer>
        </>
    );
};
const edgeOptions = {
    animated: true,
    style: {
        stroke: 'white',
    },
    direction: 'TB', // TB for vertical, LR for horizontal
};

const StartNode = ({}) => {
    return (
        <div className={'start-node'}>
            <div style={{width:'30px', height:'30px', margin: '0 auto', borderWidth:'3px', borderColor:'#52c41a', borderStyle:'solid', borderRadius:'50%'}}></div>
            <Handle type="source" position={Position.Bottom}/>
        </div>
    );
};
const EndNode = ({ data }) => {
    return (
        <div className={'start-node'}>
            <Handle type="target" position={Position.Top} />
            <div style={{width:'30px', height:'30px', margin: '0 auto', borderWidth:'3px', borderColor:'black', borderStyle:'solid', borderRadius:'50%'}}></div>
        </div>
    );
};

const ActionNode = ({ data }) => {
    const { label, description, status = 'default' } = data;
    return (
        <div className={`node ${status}`}>
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

const nodeTypes = {
    START: StartNode,
    END: EndNode,
    ACTION: ActionNode,
};


const Workflow = () => {
    const { fitView } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const getFlow = async (flowName) => {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/${flowName}`)
        if (!resp.ok) {
            console.log('Error fetching flow data: ', resp)
            return
        }

        const data = await resp.json()
        let defaultNodes = data.nodes.map(o => {return {
            id: o.id,
            type: o.type,
            data: {
                label: o.label,
                description: o.description,
                status: o.status
            }
        }})
        let initEdges = data.edges

        const layout = getLayoutedElements(defaultNodes, initEdges, edgeOptions);
        setNodes([...layout.nodes]);
        setEdges([...layout.edges]);
        return layout
    }

    const monitorStatus = async (transactionId, layout) => {
        let newNodes = [...layout.nodes]
        let newEdges = [...layout.edges]
        let allComplete = false

        const checkStatus = async () => {
            let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/status/${transactionId}`)
            if (!resp.ok) {
                console.log('Error fetching status: ', resp)
                return
            }
            let data = await resp.json()
            allComplete = true
            for (let i=0; i<newNodes.length; i++) {
                const node = newNodes[i]
                let nodeStatus = null;
                for (let j=0; j<data.length; j++) {
                    if (data[j].id === node.id) {
                        nodeStatus = data[j]
                        break
                    }
                }
                if (node?.type === 'ACTION') {
                    if (!nodeStatus) {
                        allComplete = false
                    } else if ('running' === nodeStatus.status || 'default' === nodeStatus.status) {
                        allComplete = false
                    }
                }
                if (nodeStatus) {
                    node.data.status = nodeStatus.status
                    if ('running' === nodeStatus.status) {
                        newEdges.forEach((edge) => {
                            if (edge.target === nodeStatus.id) {
                                edge.animated = true
                            }
                        })
                    } else {
                        newEdges.forEach((edge) => {
                            if (edge.target === nodeStatus.id) {
                                edge.animated = false
                            }
                        })
                    }
                }

            }
            setNodes([...newNodes])
        }
        while (!allComplete) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            await checkStatus()
        }

    }
    useEffect(()=> {
        const flowId = 'test-agent'
        fetch(`${import.meta.env.VITE_API_URL}/api/state-machine/generate-id`).then(resp => {
            if (resp.ok) {
                resp.text().then(id => {
                    fetch(`${import.meta.env.VITE_API_URL}/api/state-machine/${flowId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Correlation-ID': id
                        },
                        body: JSON.stringify({
                            flowId: flowId
                        })
                    }).then(resp => {
                        getFlow(flowId).then((layout)=> {
                            monitorStatus(id, layout).then()
                        })
                    })

                })

            } else {
                console.error('Error fetching flow id: ', resp)
            }
        })

    }, [])

    useEffect(() => {
        fitView().then();
    }, [nodes, edges])

    useEffect(() => {
        if (nodes.length > 0) {

        }
    }, [nodes]);

    return <ReactFlow nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      edgeTypes={{ custom: CustomEdge }}
                      nodeTypes={nodeTypes}
                      defaultEdgeOptions={{ type: 'custom' }}
                      fitView />
}

const CurrentFlow = () => {

    return <div style={{width: '90vw', height: '80vh'}}>
        <h1>Current Flow</h1>
        <div style={{ height: '100%', width: '100%' }}>
            <ReactFlowProvider>
                <Workflow />
            </ReactFlowProvider>
        </div>
    </div>
};

export default CurrentFlow;


insertCss(`
.node {
    display: flex;
    align-items: center;
    width: ${nodeWidth}px;
    height: ${nodeHeight}px;
    background-color: #fff;
    border: 1px solid #c2c8d5;
    border-left: 4px solid #5F95FF;
    border-radius: 4px;
    box-shadow: 0 2px 5px 1px rgba(0, 0, 0, 0.06);
}

.start-node {
    text-align: center;
    margin: 0 auto;
    width: ${nodeWidth}px;
    height: ${nodeHeight}px;
    border-left: 4px solid rgba(0, 0, 0, 0);
}

.node img {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-left: 8px;
}
.node .label {
    display: inline-block;
    flex-shrink: 0;
    width: 104px;
    margin-left: 8px;
    color: #666;
    font-size: 12px;
}
.node .status {
    flex-shrink: 0;
}
.node.success {
    border-left: 4px solid #52c41a;
}
.node.failed {
    border-left: 4px solid #ff4d4f;
}
.node.running .status img {
    animation: spin 1s linear infinite;
}
.x6-node-selected .node {
    border-color: #1890ff;
    border-radius: 2px;
    box-shadow: 0 0 0 4px #d4e8fe;
}
.x6-node-selected .node.success {
    border-color: #52c41a;
    border-radius: 2px;
    box-shadow: 0 0 0 4px #ccecc0;
}
.x6-node-selected .node.failed {
    border-color: #ff4d4f;
    border-radius: 2px;
    box-shadow: 0 0 0 4px #fedcdc;
}
.x6-edge:hover path:nth-child(2){
    stroke: #1890ff;
    stroke-width: 1px;
}

.x6-edge-selected path:nth-child(2){
    stroke: #1890ff;
    stroke-width: 1.5px !important;
}

@keyframes running-line {
    to {
        stroke-dashoffset: -1000;
    }
}
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
`)