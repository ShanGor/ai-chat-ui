import {createContext, useEffect, useState} from 'react'
import './App.css'
import LeftSider from './components/LeftSider'
import {theme, message, Layout, Flex, Tooltip, Button, Select, Divider, Slider, Checkbox, Modal} from "antd";
import ChatBoard from './components/ChatBoard';
import {PlusOutlined, SettingOutlined} from "@ant-design/icons";
import {distinct} from "./Utility.js";

const {Sider, Content, Header, Footer} = Layout;

export const mainPaneBgColor = null //'rgba(36, 36, 66, 0.8)'
export const mainPaneBorderColor = '#e3e3e3'
export const mainPaneHeaderColor = 'rgb(78 78 78)'
export const mainPaneParagraphColor = '#374151'

export const ChatUiContext = createContext(null)

const promptVersion = '20250331-2'

export let UserRoles = [
    {
        name: "Developer",
        withRag: false,
        prompt: "You are a Professional Developer Assistant that will help software developers to accomplish tasks regarding coding, testing, architecture design, database design, data processing. You should answer questions using professional terms and give code examples (with Markdown code section including language info in lowercase) whenever possible. \n \nIf you are not sure about the answer, you should answer:\"Sorry, I can only answer questions about Software Development.\""
    },
    {
        name: "BA",
        withRag: false,
        prompt: "As an AI assistant, you are required to act as a world-class product owner for a banking industry and help create elaborative user stories based on high-level business requirements. I want you to write comprehensive user stories which are distinct from each other. The user stories should be granular. DO NOT include any technical requirements. However, I would like you to create applicable non-functional requirements. DO NOT repeat the user stories. I also want you to provide acceptance criteria for every user story. Acceptance criteria could include specific features that need to be implemented, or specific performance metrics that need to be met. Your first ask is to create user stories based on the following high-level business requirement."
    },
    {
        name: "Developer",
        withRag: true,
        prompt: "You are a Professional Developer Assistant that will help software developers to accomplish tasks regarding coding, testing, architecture design, database design, data processing. You should answer questions using professional terms and give code examples (with Markdown code section including language info in lowercase) whenever possible by referencing below Documents quoted and separated in <doc></doc>. If you are not sure about the answer, you should answer:\"Sorry, I can only answer questions about Software Development.\"."
    },
    {
        name: "BA",
        withRag: true,
        prompt: "As an AI assistant, you are required to act as a world-class product owner for a banking industry and help create elaborative user stories based on high-level business requirements. I want you to write comprehensive user stories which are distinct from each other. The user stories should be granular. DO NOT include any technical requirements. However, I would like you to create applicable non-functional requirements. DO NOT repeat the user stories. I also want you to provide acceptance criteria for every user story. Acceptance criteria could include specific features that need to be implemented, or specific performance metrics that need to be met. Your first ask is to create user stories based on the user input as high-level business requirement, and reference below documents quoted and separated in <doc></doc> as your knowledge base."
    },
    {
        name: "General",
        withRag: false,
        prompt: null,
    },
    {
        name: "General",
        withRag: true,
        prompt: null,
    },
    {
        name: "Presenter",
        withRag: false,
        prompt: "You are a professional slides designer, you are able to design slides in different languages per the user speaks, in both RevealJs and PptxGenJs formats. With RevealJs, you only start from <section>, without html or body or div; With PptxGenJs, please code with javascript and start with `const pptx = new PptxGenJS();` and ends with `pptx.writeFile(`$fileName.pptx`)`",
    },
    {
        name: "Presenter",
        withRag: true,
        prompt: "You are a professional slides designer, you are able to design slides in different languages per the user speaks, in both RevealJs and PptxGenJs formats. With RevealJs, you only start from <section>, without html or body or div; With PptxGenJs, please code with javascript and start with `const pptx = new PptxGenJS();` and ends with `pptx.writeFile(`$fileName.pptx`)`; Please design by referencing the documents quoted and separated in <doc></doc>"
    },
]


function App() {
    const [messageApi, contextHolder] = message.useMessage();
    const [collapsed, setCollapsed] = useState(false)
    const [currentChat, setCurrentChat] = useState(null)
    const [currentModel, setCurrentModel] = useState('qwen2.5:0.5b')
    const [currentRole, setCurrentRole] = useState('Developer')
    const [models, setModels] = useState([])
    const [llmOption, setLlmOption] = useState({
        temperature: 0.2,
        max_completion_tokens: 4096,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,

    })
    const [currentAgent, setCurrentAgent] = useState(null)

    const {
        token: {colorBgContainer, borderRadiusLG},
    } = theme.useToken();
    const [settingConfig, setSettingConfig] = useState({
        role: null,
        withRag: false,
        prompt: ''
    })

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/tags`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Models loaded", data)
                setModels(data.models);
            });

        if (localStorage.getItem('userRole')) {
            setCurrentRole(localStorage.getItem('userRole'))
        }
        // store / retrieve prompts
        if (localStorage.getItem('prompts')) {
            if (localStorage.getItem('prompt-version') && localStorage.getItem('prompt-version') >= promptVersion) {
                UserRoles = JSON.parse(localStorage.getItem('prompts'))
            } else {
                localStorage.setItem('prompts', JSON.stringify(UserRoles))
                localStorage.setItem('prompt-version', promptVersion)
            }
        } else {
            localStorage.setItem('prompts', JSON.stringify(UserRoles))
        }

        // store / retrieve options
        if (localStorage.getItem('options')) {
            const option = JSON.parse(localStorage.getItem('options'))
            setLlmOption(option)
        } else {
            localStorage.setItem('options', JSON.stringify(llmOption))
        }

    }, [])

    useEffect(() => {
        if (currentAgent) {
            setCollapsed(true)
        }
    }, [currentAgent]);
    useEffect(() => {
        if (!collapsed) {
            setCurrentAgent(null)
        }
    }, [collapsed]);

    useEffect(()=>{
        localStorage.setItem('options', JSON.stringify(llmOption))
    }, [llmOption])

    useEffect(() => {
        if (models && models.length > 0) {
            // store / retrieve model
            if (localStorage.getItem('model')) {
                let oldModel = localStorage.getItem('model')
                for (let i in models) {
                    if (models[i].name === oldModel) {
                        setCurrentModel(oldModel)
                        break
                    }
                }
            }
        }
    }, [models]);

    const modelChange = (value) => {
        localStorage.setItem('model', value)
        setCurrentModel(value)
    }

    const userRoleChange = (value) => {
        localStorage.setItem('userRole', value)
        setCurrentRole(value)
    }
    const [doSettings, setDoSettings] = useState(false)
    const onConfirmChangePrompt = () => {
        for (let i = 0; i < UserRoles.length; i++) {
            let o = UserRoles[i]
            if (o.withRag === settingConfig.withRag && o.name === settingConfig.role) {
                UserRoles[i].prompt = settingConfig.prompt
                localStorage.setItem('prompts', JSON.stringify(UserRoles))
                break
            }
        }
        setDoSettings(false)
    }


    const onSettingChoiceChange = (obj) => {
        let old = {...settingConfig}
        if (obj.role) {
            old.role = obj.role
        } else {
            old.withRag = obj.withRag
        }
        old.prompt = UserRoles.filter(o => o.name === old.role && o.withRag === old.withRag)[0].prompt
        setSettingConfig(old)
    }

    const onSettingPromptChanged = (promptStr) => {
        let old = {...settingConfig}
        old.prompt = promptStr
        setSettingConfig(old)
    }

    return (
        <ChatUiContext.Provider value={{messageApi, currentChat, setCurrentChat, llmOption, setLlmOption, currentAgent, setCurrentAgent}}>
            {contextHolder}
            <Layout theme='dark' style={{width: '100vw', minHeight: '100vh'}}>
                <Header style={{
                    height: '3rem', width: '100vw',
                    position: 'fixed',
                }}>
                    <Flex style={{color: 'white'}}>
                        <div style={{width: '15rem'}}>
                            <div style={{marginTop: '-1rem', marginLeft: '-1rem'}}>
                                <h2>AI Chat</h2>
                            </div>
                        </div>
                        <Flex justify={"space-between"} style={{width: '100%', marginTop:'-0.6rem'}}>
                            <div></div>
                            <div>
                                <span style={{marginRight: '0.5rem'}}>
                                  <Tooltip title='Create a new chat'>
                                    <Button size="middle" style={{color: 'white', backgroundColor: 'green'}}
                                            onClick={() => {
                                                setCurrentAgent(null)
                                                setCurrentChat({initiatedBySide: true})
                                            }}
                                            icon={<PlusOutlined/>}/>
                                  </Tooltip>
                                </span>
                                <span style={{marginRight: '0.5rem', fontSize: '1.3rem'}}>Select a model:</span>
                                <Select style={{width: '150px'}}
                                        value={currentModel} onSelect={modelChange}
                                        placeholder="from the list"
                                        options={models.map(model => {
                                            return {value: model.name, label: model.display}
                                        })}/>
                                <span style={{marginLeft: '0.5rem', marginRight: '0.5rem', fontSize: '1.3rem'}}>Your role:</span>
                                <Select style={{width: '150px'}}
                                        value={currentRole} onSelect={userRoleChange}
                                        placeholder="from the list"
                                        options={UserRoles.map(role => role.name).filter(distinct).map(name => {
                                            return {value: name, label: name}
                                        })}/>
                            </div>
                            <div style={{marginTop: '0.4rem'}}>
                                <Tooltip title='Settings' placement='bottom'>
                                    <Button shape='circle' type="text"
                                            icon={<SettingOutlined style={{color: 'white', fontSize: '24px'}}/>} size="large"
                                            onClick={() => {
                                                setDoSettings(true)
                                            }}/>
                                </Tooltip>
                            </div>
                        </Flex>
                    </Flex>
                </Header>
                <Content theme='dark' className='full-height'>
                    <Layout hasSider theme='dark' style={{height: '100%'}}>
                        <Sider collapsible collapsed={collapsed}
                               width='15rem'
                               style={{
                                   overflow: 'auto',
                                   height: '100vh',
                                   position: 'fixed',
                                   left: 0,
                                   top: '3rem',
                                   bottom: 0,
                               }}
                               collapsedWidth={15} className='full-height'
                               onCollapse={(collapsed) => {
                                   setCollapsed(collapsed)
                               }}>
                            <LeftSider collapsed={collapsed}/>
                        </Sider>
                        <Content style={{
                            color: mainPaneBgColor,
                            marginTop: '2rem',
                            marginLeft: `${collapsed ? '0.5rem' : '15rem'}`,
                            paddingLeft: '0.5rem',
                            paddingTop: '0.5rem'
                        }}>
                            <ChatBoard collapsed={collapsed} currentModel={currentModel} currentRole={currentRole}/>
                        </Content>
                    </Layout>
                </Content>
            </Layout>

            <Modal title="Config Your Local settings" open={doSettings} onOk={() => {
                onConfirmChangePrompt()
            }} onCancel={() => {
                setDoSettings(false)
            }}>
                <h4>Options</h4>
                <Flex gap='small'>
                    <div>Temperature: <span style={{fontStyle: "italic"}}>Accurate</span></div>
                    <div style={{marginTop: '-0.2rem'}}>
                        <Slider style={{width: '150px'}} value={llmOption.temperature} step={0.1} min={0.1} max={0.9}
                                onChange={v => {
                                    setLlmOption(prev => {return {...llmOption, temperature: v}})
                                }}/>
                    </div>
                    <div><span style={{fontStyle: "italic"}}>Creative</span></div>
                </Flex>
                <h4>Prompts</h4>
                <Flex gap='small'>
                    <div><Select style={{width: '120px'}}
                                 placeholder='Choose role'
                                 onSelect={(v) => {
                                     onSettingChoiceChange({role: v})
                                 }}
                                 value={settingConfig.role}>
                        {UserRoles.map(o => o.name).filter(distinct).map((name) =>
                            <Select.Option key={name}>{name}</Select.Option>
                        )}
                    </Select></div>
                    <div style={{marginTop: '0.3rem'}}>
                        <span style={{marginRight: '0.5rem'}}>With RAG:</span>
                        <Checkbox checked={settingConfig.withRag}
                                  onChange={(e) => {
                                      onSettingChoiceChange({withRag: e.target.checked})
                                  }
                                  }/>
                    </div>
                </Flex>
                <div style={{marginTop: '0.5rem'}}>
               <textarea cols={74} rows={10} value={settingConfig.prompt} onChange={(e) => {
                   onSettingPromptChanged(e.target.value)
               }}></textarea>
                </div>
            </Modal>
        </ChatUiContext.Provider>
    )
}

export default App
