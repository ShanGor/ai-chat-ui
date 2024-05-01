import {Select, Divider, Avatar, Flex, Typography, Spin, Tooltip, Image } from "antd"
import { useState, useEffect, useContext } from "react"
import { ChatUiContext, mainPaneParagraphColor } from "../App"
import {
    AndroidOutlined,
    CopyOutlined,
    ReloadOutlined,
  } from '@ant-design/icons';
import QuickTask from "./QuickTask";
import "./MarkdownCustom.css"
import ChatBox from "./ChatBox";
import user from '../assets/user.svg'
import assistant from '../assets/assistant.svg'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'

const { Title } = Typography;

const abbr = (str) => {
    if (str && str.length > 255) {
        return str.substring(0, 255) + '...'
    } else {
        return str
    }
}

let generatingTextCache = ''
let generatingBoxHeightCache=0

const ChatBoard = () => {
    const [models, setModels] = useState([])
    const [currentModel, setCurrentModel] = useState(null)
    const [message, setMessage] = useState('')
    const [generating, setGenerating] = useState(false)
    const [generatingText, setGeneratingText] = useState('')
    const {currentChat, setCurrentChat, messageApi} = useContext(ChatUiContext)
    const [chatHistory, setChatHistory] = useState([])
    const [chatboxTop, setChatboxTop] = useState(0)
    const [selectModeBottom, setSelectModeBottom] = useState(0)
    const [contentPaneHeight, setContentPaneHeight] = useState('70vh')

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/tags`).then(res => res.json()).then(data => {
            setModels(data.models)
        })
        if (localStorage.getItem('model')) {
            setCurrentModel(localStorage.getItem('model'))
        }
    }, [])

    useEffect(() => {
        if (currentChat && currentChat.initiatedBySide) {
            setChatHistory(currentChat.chats || [])
        }
    }, [currentChat])

    useEffect(() => {
        if (chatHistory && chatHistory.length > 0) {
            let o
            if (currentChat?.id) {
                o = {...currentChat}
                o.initiatedBySide = undefined
                o.chats = chatHistory
            } else {
                o = {id: Date.now(), chats: chatHistory, name: abbr(chatHistory[0].content.message)}
            }
            setCurrentChat(o)
        }
    }, [chatHistory])

    useEffect(() => {
        if (chatboxTop > 0 && selectModeBottom > 0) {
            setContentPaneHeight(`${chatboxTop - selectModeBottom + 20}px`)
        }
    }, [chatboxTop, selectModeBottom])

    const modelChange = (value) => {
        localStorage.setItem('model', value)
        setCurrentModel(value)
    }

    const onQuickTask = (task) => {
        setMessage(task + "\n")
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            messageApi.open({
                type: 'success',
                content: 'Source code copied to clipboard!',
                
            })
        })
        
    }

    const setSizeChanged = () => {
        // console.log('size changed, pls check')
        setChatboxTop(document.getElementById('chat-box-parent').getBoundingClientRect().top)
    }

    const responseHandler = (data) => {
        // console.log("got data", data)
        setGenerating(true)

        if (data?.message?.content) {
            generatingTextCache += data.message.content
            setGeneratingText(generatingTextCache)

            // Move the view to the end of the chat history
            setTimeout(() => {
                let height = document.getElementById('generating-box-parent')?.getBoundingClientRect()?.height || 0
                if (height > (generatingBoxHeightCache + 30)) {
                    generatingBoxHeightCache = height
                    // console.log('height', generatingBoxHeightCache)
                    document.getElementById('generating-position')?.scrollIntoView(true, {behavior: 'smooth'})
                }
            }, 1000)
        }

        if (data?.done) {
            // console.log("done as: ", generatingTextCache)
            setChatHistory(old => [...old, {
                content: {
                    message: generatingTextCache,
                    model: data.model,
                    created_at: data.created_at
                },
                role: 'assistant',
            }])
            setGenerating(false)
            generatingTextCache = ''
            generatingBoxHeightCache=0
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''

        if (dateStr.indexOf('T') > 0) {
            return new Date(Date.parse(dateStr)).toLocaleString()
        } else {
            return dateStr
        }
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
                value={currentModel} onSelect={modelChange}
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
                      <div style={{width:'10%', minWidth: '7rem'}}>{
                        item.role === 'assistant'?
                        <>
                          <Avatar src={assistant} />
                          <div>{item.content.model}</div>
                        </>:
                        <Avatar src={user} />
                      }</div>
                      <div style={{width:'90%', textAlign:'left'}}>
                        <div style={{fontSize: '0.7rem', color: mainPaneParagraphColor, marginTop: '0rem', marginBottom: '0.5rem'}}>
                            {formatDate(item.content?.created_at)}
                        </div>
                        <div>
                            {item.images?.length > 0 && <Flex wrap="wrap" gap='small'>
                                {item.images?.map((image, index) => {
                                return <div key={index}>
                                    <Image src={image} style={{maxWidth:'6rem', maxHeight: '6rem'}}/>
                                </div>
                                })}
                            </Flex>}
                            <Markdown remarkPlugins={[remarkGfm]} id={`message-${index}`}
                                      children={item.content?.message}
                                      components={{
                                        code(props) {
                                          const {children, className, node, ...rest} = props
                                          const match = /language-(\w+)/.exec(className || '')
                                          return match ? (
                                            <div style={{position: 'relative'}}>
                                            <SyntaxHighlighter
                                              {...rest}
                                              PreTag="div"
                                              children={String(children).replace(/\n$/, '')}
                                              language={match[1]}
                                              style={dark}
                                            />
                                            <div style={{position: 'absolute', top: '0.2rem', right: '0.2rem'}}>
                                              <Tooltip title={`Copy code: ${match[1]}`}>
                                                <a style={{color: 'white'}} onClick={() => copyCode(children)}>{<CopyOutlined />}</a>
                                              </Tooltip>  
                                            </div>
                                            </div>
                                          ) : (
                                            <code className={`${className} not-code`}>
                                              {children}
                                            </code>
                                          )
                                        }
                                      }}
                            />
                        </div>
                      </div>
                    </Flex>
                    <Divider></Divider>
                </div>
                })}
                {generating && <Flex style={{width: '98%', position: 'relative', minHeight: '5rem'}}>
                    <div style={{width:'10%', minWidth: '7rem'}}>
                          <Avatar src={assistant} />
                          <div>{currentModel}</div>
                    </div>
                    <div style={{width:'90%', textAlign:'left'}}>
                        <div style={{fontSize: '0.7rem', color: mainPaneParagraphColor, marginTop: '0rem', marginBottom: '0.5rem'}}>
                            {formatDate(new Date().toLocaleString())}
                            <Spin size='small' style={{marginLeft: '0.5rem'}}/>
                        </div>
                        <div id='generating-box-parent'>
                            <Markdown remarkPlugins={[remarkGfm]}>{generatingText}</Markdown>
                            <Spin style={{marginLeft: '0.5rem'}}
                                  tipe='Generating..'
                                  indicator={
                                    <ReloadOutlined
                                      style={{
                                        fontSize: 12,
                                      }}
                                      spin
                                    />
                                  }
                            />
                            <span id='generating-position'></span>
                        </div>
                    </div>
                </Flex>}
            </div>:
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
          <ChatBox message={message} model={currentModel}
                   setMessage={setMessage} setChatHistory={setChatHistory}
                   responseHandler={responseHandler}
                   setSizeChanged={setSizeChanged}/>
        </div>
    </div>
    )
}

export default ChatBoard