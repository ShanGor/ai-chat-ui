import {Select, Divider, Avatar, Card, Flex, Typography } from "antd"
import { useState, useEffect, useContext } from "react"
import { ChatUiContext, mainPaneParagraphColor } from "../App"
import {
    AndroidOutlined,
  } from '@ant-design/icons';
import QuickTask from "./QuickTask";
import ChatBox from "./ChatBox";
import user from '../assets/user.svg'
import assistant from '../assets/assistant.svg'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const { Title } = Typography;


const ChatBoard = () => {
    const [models, setModels] = useState([])
    const [currentModel, setCurrentModel] = useState(null)
    const [message, setMessage] = useState('')
    const {setCurrentChat, currentChat} = useContext(ChatUiContext)
    const [chatHistory, setChatHistory] = useState([])
    const [chatboxTop, setChatboxTop] = useState(0)
    const [selectModeBottom, setSelectModeBottom] = useState(0)
    const [contentPaneHeight, setContentPaneHeight] = useState('70vh')

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/tags`).then(res => res.json()).then(data => {
            setModels(data.models)
        })
    }, [])

    useEffect(() => {
        if (currentChat) {
            setChatHistory(currentChat.chats)
        }
    }, [currentChat])

    useEffect(() => {
        if (chatboxTop > 0 && selectModeBottom > 0) {
            setContentPaneHeight(`${chatboxTop - selectModeBottom + 20}px`)
        }
    }, [chatboxTop, selectModeBottom])

    const onQuickTask = (task) => {
        setMessage(task + "\n")
    }

    const setSizeChanged = () => {
        console.log('size changed, pls check')
        setChatboxTop(document.getElementById('chat-box-parent').getBoundingClientRect().top)
    }

    return (<div className="center">
        <div style={{top: '2.65rem', left: '16rem', position: 'fixed', width: '80%'}} ref={(el) => {
            if (el) {
                setSelectModeBottom(el.getBoundingClientRect().bottom);
            }
        }}>
            <Divider orientation='center'>
                <span style={{marginRight: '0.5rem', fontSize: '1.3rem'}}>Select a model:</span>
              <Select style={{width: '150px'}}
                value={currentModel} onSelect={setCurrentModel}
                placeholder="from the list"
                options={models.map(model => {
                    return {value: model.name, label: model.name}
                })} />
            </Divider>
        </div>
        <div style={{marginTop: '3.5rem', height: contentPaneHeight, width: '100%', overflowY: 'scroll', overflowX: 'hidden'}}>
            {chatHistory.length > 0 ? <div style={{width: '99%'}}>{
             chatHistory.map((item, index) => {
                return <div key={index}>
                    <Flex style={{width: '98%'}}>
                      <div style={{width:'10%'}}>{
                        item.role === 'assistant'?
                        <>
                          <Avatar src={assistant} />
                          <div>{item.content.model}</div>
                        </>:
                        <Avatar src={user} />
                      }</div>
                      <div style={{width:'90%', textAlign:'left'}}>
                        <div style={{fontSize: '0.7rem', color: mainPaneParagraphColor, marginTop: '0rem', marginBottom: '0.5rem'}}>
                            {item.content?.created_at}
                        </div>
                        <div>
                            {item.images?.length > 0 && <Flex wrap="wrap" gap='small'>
                                {item.images?.map((image, index) => {
                                return <div key={index}>
                                    <img src={image.url} style={{maxWidth:'6rem', maxHeight: '6rem'}}/>
                                </div>
                                })}
                            </Flex>}
                            <Markdown remarkPlugins={[remarkGfm]}>{item.role === 'assistant'?item.content?.response:item.content?.message}</Markdown>
                        </div>
                      </div>
                    </Flex>
                    <Divider></Divider>
                </div>
            })}</div>:
            <div>
              <div style={{width: '100%'}}>
                  <div className="center" 
                       style={{borderRadius: '50%', width: '3rem', height: '3rem', border: '1px solid #ccc', background: 'white', marginTop: '2rem', marginBottom: '-1.5rem'}}>
                    <AndroidOutlined style={{fontSize: '1.5rem', marginTop: '0.7rem'}} />
                  </div>
                  <Title level={3} style={{color: mainPaneParagraphColor}}>Hi pretty!<br/>
                  How can I help you today!</Title>
              </div>
              <Flex justify="center" style={{width: '800px'}} className="center" gap='large' wrap="wrap">
                  <QuickTask onClick={onQuickTask} title='Tell me a joke' description='about the Roman Empire' />
                  <QuickTask onClick={onQuickTask} title='Show me a code snippet' description="of a website's sticky header" />
                  <QuickTask onClick={onQuickTask} title='Help me study' description='vacabulary for a college entrance exam' />
                  <QuickTask onClick={onQuickTask} title='Give me ideas' description="for what to do with my kids's art" />
              </Flex>
            </div>}
        </div>
        
        <div style={{position: 'fixed', bottom: '0', width: '80%', margin: '0 auto'}} id='chat-box-parent' ref={(el) => {
            if (el) {
                setChatboxTop(el.getBoundingClientRect().top);
            }
        }}>
          <ChatBox message={message} model={currentModel} setMessage={setMessage} setSizeChanged={setSizeChanged}/>
        </div>
    </div>
    )
}

export default ChatBoard