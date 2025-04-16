import {
    ReactFlow,
    useReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState, Controls
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import {useContext, useEffect, useRef, useState} from "react";
import {getLayoutedElements} from "./ReactFlowUtil.jsx";
import {insertCss} from "insert-css";
import {CustomEdge} from "./CustomEdge.jsx";
import {ActionNode, EndNode, StartNode} from "./CustomNode.jsx";
import {Avatar, Card, Flex, List, Spin, Tabs} from "antd";
import {ChatUiContext} from "../../App.jsx";
import {FlowHistory} from "./FlowHistory.jsx";
import assistant from "../../assets/assistant.svg";
import user from "../../assets/user.svg";
import MarkdownCustom from "../MarkdownCustom.jsx";


const nodeWidth = 180;
const nodeHeight = 36;

const edgeOptions = {
    animated: true,
    style: {
        stroke: 'white',
    },
    direction: 'TB', // TB for vertical, LR for horizontal
};

const nodeTypes = {
    START: StartNode,
    END: EndNode,
    ACTION: ActionNode,
};

const monitorStatus = async (transactionId, layout, setNodes, setData=null, setLoading=null) => {
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
        if (setData) setData(data)
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
        await new Promise(resolve => setTimeout(resolve, 2000))
        await checkStatus()
        if (setLoading) setLoading(false)
    }
}

const Workflow = ({agentName, agentContext, setAgentContext, flowProps}) => {
    const { fitView } = useReactFlow();
    const { messageApi} = useContext(ChatUiContext)
    const {nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, layout, setLayout, setData} = flowProps

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
        setLayout(layout)
    }

    useEffect(()=> {
        getFlow(agentName).then()
    }, [])

    useEffect(() => {
        fitView().then();
    }, [nodes, edges])

    useEffect(() => {
        if (agentContext) {
            fetch(`${import.meta.env.VITE_API_URL}/api/state-machine/generate-id`).then(resp => {
                if (resp.ok) {
                    resp.text().then(id => {
                        // Create the history record
                        fetch(`${import.meta.env.VITE_API_URL}/api/flow-histories`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                agentName: agentName,
                                submissionId: id,
                            })
                        }).then()

                        // Submit the request
                        fetch(`${import.meta.env.VITE_API_URL}/api/state-machine/${agentName}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Correlation-ID': id
                            },
                            body: JSON.stringify(agentContext)
                        }).then(resp => {
                            if (resp.ok) {
                                messageApi.open({
                                    type: 'success',
                                    content: 'Flow started successfully',
                                })
                            } else {
                                messageApi.open({
                                    type: 'error',
                                    content: 'Error starting flow',
                                })
                                console.error('Error starting flow: ', resp)
                            }
                        })

                        monitorStatus(id, layout, setNodes, setData).then()
                    })

                } else {
                    console.error('Error fetching flow id: ', resp)
                }
            })
            setAgentContext(null)
        }
    }, [agentContext]);

    return <ReactFlow nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      edgeTypes={{ custom: CustomEdge }}
                      nodeTypes={nodeTypes}
                      defaultEdgeOptions={{ type: 'custom' }}
                      fitView>
        <Controls />
    </ReactFlow>
}

const CurrentFlow = ({agentName, agentContext, setAgentContext, style={width: '95vw', height: '80vh'}}) => {
    const [activeKey, setActiveKey] = useState('1')
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [layout, setLayout] = useState(null)
    const [flowDetails, setFlowDetails] = useState([])
    const [loading, setLoading] = useState(false)
    const mainRef = useRef()

    const onChosen = (id) => {
        setActiveKey('1')
        setLoading(true)
        monitorStatus(id, layout, setNodes, setFlowDetails, setLoading).then()
    }
    const items = [
        {
            key: '1',
            label: 'Flow',
            children: <div style={{ height: '65vh', width: '20vw' }}>
                <ReactFlowProvider>
                    <Workflow agentName={agentName} agentContext={agentContext} setAgentContext={setAgentContext}
                              flowProps={{nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange,
                                  layout, setLayout,
                                  setData: setFlowDetails}}/>
                </ReactFlowProvider>
            </div>
        },
        {
            key: '2',
            label: 'History',
            children: <div style={{ height: style.height, width: '20vw', textAlign: 'left'}}>
                <FlowHistory agentName={agentName} agentContext={agentContext} setAgentContext={setAgentContext} onChosen={onChosen}/>
            </div>
        }
    ]
    return <div style={style} ref={mainRef}>
        <Spin spinning={loading} percent="auto" fullscreen />
        <Flex>
            <div style={{height: style.height, width: '20%', position: 'sticky', top: 0}}>
                <Tabs activeKey={activeKey} type="card" onChange={key => setActiveKey(key)} items={items}/>
            </div>
            <div>
                <div style={{width: '78vw'}}>
                    {flowDetails.map((d, i) => {
                        const node = nodes.filter(n => n.id === d.id)[0]
                        const positionId = `history-pane-${node?.id}`
                        if (!node || node.type !== 'ACTION' || 'default'===node.data?.status ) return <div id={positionId}></div>

                        if ('running'===node.data?.status) return <div style={{width: '5rem'}}><Spin id={positionId} spinning={true} size={'large'}></Spin></div>

                        const title = node.data.label
                        const ctx = d.context;
                        let data = []
                        if (ctx.chatHistory?.length >= 2) {
                            data.push(ctx.chatHistory[ctx.chatHistory.length-2])
                            data.push(ctx.chatHistory[ctx.chatHistory.length-1])
                        }

                        return <Card key={i} id={positionId} title={title} style={{marginBottom: '1rem', textAlign: 'left'}} >
                            <List
                                itemLayout="horizontal"
                                dataSource={data}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar src={index===0 ? user : assistant} />}
                                            title={index===0 ? 'Input' : 'Output'}
                                            description={<MarkdownCustom markdownScript={item.text} index={index} />}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    })}
                </div>
            </div>
        </Flex>

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