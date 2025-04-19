import {useContext, useEffect, useState} from "react";
import {ChatUiContext} from "../../App.jsx";
import {Button, Col, Flex, Input, Modal, Popconfirm, Row, Table, Tooltip} from "antd";
import './Agents.css'
import {formatDatetime} from "../../Utility.js";
import {BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";

const Agents = () => {
    const [data, setData] = useState([]);
    const {messageApi} = useContext(ChatUiContext)
    const [loading, setLoading] = useState(false);
    const [currentAgent, setCurrentAgent] = useState(null)
    const [displayDetail, setDisplayDetail] = useState(false)
    const [displayForm, setDisplayForm] = useState(false)
    const [currentAction, setCurrentAction] = useState(null)

    useEffect(() => {
        refreshData().then()
    }, []);

    const refreshData = async () => {
        setLoading(true)
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/agents`)
        if (resp.ok) {
            const json = await resp.json()
            setData(json)

        } else {
            messageApi.error('Failed to fetch agents: ' + resp.status)
            resp.text().then(txt => console.error('Failed to fetch agents: ' + resp.status, txt))
        }
        setLoading(false)

    }
    const deleteAgent = async (agentName) => {
        console.log('deleting agent ' + agentName)
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/agents/${agentName}`, {
            method: 'DELETE'
        })
        if (resp.ok) {
            messageApi.success('Successfully deleted agent ' + agentName)
            refreshData().then()
        } else {
            messageApi.error('Failed to delete agent ' + agentName + ': ' + resp.status)
            resp.text().then(txt => console.error('Failed to delete agent ' + agentName + ': ' + resp.status, txt))
        }
    }

    const columns = [{
        title: 'Agent Name',
        dataIndex: 'alias',
        key: 'agentName',
        render: (_, record) => {
            return record.alias || record.agentName
        }
    }, {
        title: 'Model',
        dataIndex: 'model',
        key: 'model',
    }, , {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
    }, {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => {
            return <Flex gap='small'>
                <Tooltip title={'View agent details'}>
                    <a onClick={() => {
                        setCurrentAgent(record)
                        setDisplayDetail(true)
                    }}><BookOutlined/></a>
                </Tooltip>

                <Tooltip title='Edit the agent details'>
                    <a onClick={() => {
                        setCurrentAction('Edit')
                        setCurrentAgent(record)
                        setDisplayForm(true)
                    }}><EditOutlined/></a>
                </Tooltip>

                <Tooltip title='Delete the agent'>
                    <Popconfirm title='Delete the agent' description={'Are you sure to delete this agent?'} onConfirm={() => deleteAgent(record.agentName)}>
                        <DeleteOutlined style={{color: "#eb2f96"}}/>
                    </Popconfirm>
                </Tooltip>
            </Flex>
        }
    }]
    return <div>
        <h2>Agents</h2>
        <div>
            <Button type="primary" shape='circle' icon={<PlusOutlined size='large' />}
                    onClick={() => {
                setCurrentAction('Create')
                setCurrentAgent({})
                setDisplayForm(true)
            }} />
        </div>
        <Table dataSource={data}
               rowKey={(record) => record.agentName}
               columns={columns}
               loading={loading}/>;
        <ViewDetail displayDetail={displayDetail} setDisplayDetail={setDisplayDetail} currentAgent={currentAgent} />
        <CreateOrEditForm currentAction={currentAction} refreshData={refreshData}
                          currentAgent={currentAgent} setCurrentAgent={setCurrentAgent}
                          displayForm={displayForm} setDisplayForm={setDisplayForm} />
    </div>

}

const ViewDetail = ({displayDetail, setDisplayDetail, currentAgent}) => {
    return <Modal title="View Agent Details" open={displayDetail} onOk={() => setDisplayDetail(false)}
                  onCancel={() => setDisplayDetail(false)}>
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Model: </Col>
            <Col span={18}>{currentAgent?.model}</Col>
        </Row>
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>System Prompt: </Col>
            <Col span={18} className='prompt'>
                    <pre>
                    {currentAgent?.systemPrompt || "No system prompt"}
                    </pre>
            </Col>
        </Row>
        <Row className='has-above-row'>
            <Col span={6} className='label'>User Prompt: </Col>
            <Col span={18} className='prompt'>
                    <pre>
                    {currentAgent?.userPrompt}
                    </pre>
            </Col>
        </Row>
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Tools: </Col>
            <Col span={18}>{currentAgent?.tools?.join(", ") || "No tools"}</Col>
        </Row>
        <p className='has-above-row audit-info'>
            {currentAgent?.creationTime && `Created at ${formatDatetime(new Date(currentAgent?.creationTime))}`}
            {currentAgent?.lastUpdateTime && `, last updated at ${formatDatetime(new Date(currentAgent?.lastUpdateTime))}`}
        </p>
    </Modal>
}

const MustStar = () => {
    return <span style={{color: 'red'}}>*</span>
}


const CreateOrEditForm = ({displayForm, setDisplayForm, currentAgent, setCurrentAgent, currentAction, refreshData}) => {
    const [formError, setFormError] = useState({})
    const {messageApi} = useContext(ChatUiContext)

    const submitChange = async () => {
        let passed = true
        let error = {}
        setFormError(error)
        if (currentAction === 'Create' && !currentAgent?.agentName) {
            passed = false
            error.agentName = 'Agent name is required'
        }
        if (!(currentAgent?.model)) {
            passed = false
            error.model = 'Model is required'
        }
        if (!(currentAgent?.userPrompt)) {
            passed = false
            error.userPrompt = 'User prompt is required'
        }

        if (passed) {
            setFormError({})
            let method = 'POST'
            if (currentAction === 'Edit') {
                method = 'PUT'
            }
            const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/agents`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentAgent)
            })
            if (resp.ok) {
                let data = await resp.json()
                console.log("created agent", data)
                messageApi.success(`Agent ${data.agentName} ${currentAction}ed!`)
                setCurrentAgent(data)
            } else {
                let txt = await resp.text()
                console.error('Failed to create agent: ' + resp.status, txt)
                messageApi.error(`Failed to create agent: ${txt}`)
            }
            setDisplayForm(false)

            refreshData()
        } else {
            setFormError(error)
        }
    }

    return <Modal title={`${currentAction} an Agent`} open={displayForm} onOk={submitChange}
                  onCancel={() => {
                      setDisplayForm(false)
                      setFormError({})
                  }}>
        {currentAction === 'Create' && <><Row className={'has-above-row'}>
            <Col span={6} className='label'>Agent Name: <MustStar/></Col>
            <Col span={18}>
                <Input value={currentAgent?.agentName}
                       placeholder='Please input the name of the agent'
                       onChange={evt => {
                           setCurrentAgent({...currentAgent, agentName: evt.target.value})
                       }}/>
            </Col>
        </Row>
            {formError?.agentName && <div style={{color: 'red'}}>{formError.agentName}</div>}
        </>}
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Alias: </Col>
            <Col span={18}>
                <Input value={currentAgent?.alias}
                       placeholder='Alias of the agent name'
                       onChange={evt => {setCurrentAgent({...currentAgent, alias: evt.target.value})}}/>
            </Col>
        </Row>
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Description: </Col>
            <Col span={18}>
                <Input value={currentAgent?.description}
                       placeholder='Description of the agent'
                       onChange={evt => {setCurrentAgent({...currentAgent, description: evt.target.value})}}/>
            </Col>
        </Row>
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Model: <MustStar/></Col>
            <Col span={18}>
                <Input value={currentAgent?.model}
                       placeholder='LLM Model name, please ensure it is correct'
                       onChange={evt => {setCurrentAgent({...currentAgent, model: evt.target.value})}}/>
            </Col>
        </Row>
        {formError.model && <div style={{color: 'red'}}>{formError.model}</div>}
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>System Prompt: </Col>
            <Col span={18} className='prompt'>
                <Input.TextArea value={currentAgent?.systemPrompt}
                                placeholder='System prompt, some models does not support it'
                                autoSize={{minRows: 3}}
                                onChange={evt => {setCurrentAgent({...currentAgent, systemPrompt: evt.target.value})}} />
            </Col>
        </Row>
        <Row className='has-above-row'>
            <Col span={6} className='label'>User Prompt: <MustStar/></Col>
            <Col span={18} className='prompt'>
                <Input.TextArea value={currentAgent?.userPrompt}
                                placeholder='Play your magic with the prompt'
                                autoSize={{minRows: 3, maxRows: 6}}
                                onChange={evt => {setCurrentAgent({...currentAgent, userPrompt: evt.target.value})}} />
            </Col>
        </Row>
        {formError.userPrompt && <div style={{color: 'red'}}>{formError.userPrompt}</div>}
        <Row className={'has-above-row'}>
            <Col span={6} className='label'>Tools: </Col>
            <Col span={18}>
                <Input value={currentAgent?.tools?.join(", ") || ""}
                       placeholder='Tools names, separated by comma'
                       onChange={evt => {
                           setCurrentAgent({...currentAgent, tools: evt.target.value.split(",").map(t => t.trim())})
                       }}/>
            </Col>
        </Row>
    </Modal>
}

export default Agents