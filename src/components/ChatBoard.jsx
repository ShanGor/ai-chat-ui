import { Checkbox, Select, Divider, Avatar, Flex, Tooltip, Image, Button } from "antd"
import { useState, useEffect, useContext } from "react"
import { ChatUiContext, mainPaneParagraphColor } from "../App"
import {
    CopyOutlined,
    EditOutlined,
    RedoOutlined,
    PlusOutlined,
  } from '@ant-design/icons';
import "./MarkdownCustom.css"
import ChatBox from "./ChatBox";
import user from '../assets/user.svg'
import assistant from '../assets/assistant.svg'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import NewChats from "./NewChats";
import GeneratingResponseSection from "./GeneratingResponseSection";
import { abbr, cancelGeneration, formatDate } from "../Utility";

let generatingTextCache = ''
let generatingBoxHeightCache=0

const ChatBoard = ({collapsed}) => {
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
    const [requestId, setRequestId] = useState('')
    const [chatboxWidth, setChatboxWidth] = useState('90%')
    const [useRag, setUseRag] = useState(false)

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
                o = {id: Date.now(), chats: chatHistory, name: abbr(chatHistory[0].content.message, 255)}
            }
            setCurrentChat(o)
        }
    }, [chatHistory])

    useEffect(() => {
        if (chatboxTop > 0 && selectModeBottom > 0) {
            setContentPaneHeight(`${chatboxTop - selectModeBottom + 20}px`)
        }
    }, [chatboxTop, selectModeBottom])

    useEffect(() => {
        let mainPane = document.getElementById('chat-board-main')
        if (mainPane) {
            let totalWidth = mainPane.getBoundingClientRect().width
            let targetWidth = `${Math.round(totalWidth * 0.9)}px`
            setChatboxWidth(targetWidth)
            console.log("target width is", targetWidth)
        }
    }, [collapsed])

    const modelChange = (value) => {
        localStorage.setItem('model', value)
        setCurrentModel(value)
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            messageApi.open({
                type: 'success',
                content: 'Source code copied to clipboard!',
                
            })
        })
    }

    const isLastQuestion = (index) => {
        let lastIndex = chatHistory.length - 1
        if (index == lastIndex) {
            if (chatHistory[index].role=='user') {
                return true
            }
        } else if (index == lastIndex - 1) {
            if (chatHistory[lastIndex].role=='assistant' && chatHistory[index].role=='user') {
                return true
            }
        } 
        return false
    }

    const cancelRequest = () => {
        cancelGeneration()

        fetch(`${import.meta.env.VITE_API_URL}/api/cancel/${requestId}`).then(resp => {
          if (resp.status === 200) {
            console.log('Request cancelled')
          }
        }).then(()=>setTimeout(() => {
            setGenerating(false)
            setGeneratingText('')
        }, 100))
    }

    const setSizeChanged = () => {
        // console.log('size changed, pls check')
        setChatboxTop(document.getElementById('chat-box-parent').getBoundingClientRect().top)
    }

    const toggleRag = (e) => {
        setUseRag(e.target.checked)
    }

    const responseHandler = (data) => {
        // console.log("got data", data)
        setGenerating(true)

        if (data?.id) {
            setRequestId(data.id)
            generatingTextCache = ''
        }

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
            setGeneratingText(generatingTextCache)
        }
    }

    return (<div className="center" id='chat-board-main'>
        <div style={{top: '2.65rem', left: '16rem', position: 'fixed', width: '80%'}} ref={(el) => {
            if (el) {
                setSelectModeBottom(el.getBoundingClientRect().bottom);
            }
        }}>
            <Divider orientation='center'>
              <span style={{marginRight:'0.5rem'}}>
                <Tooltip title='Create a new chat'>
                  <Button size="middle" style={{color:'white', backgroundColor:'green'}}
                        onClick={() => {setCurrentChat({initiatedBySide: true})}}
                        icon={<PlusOutlined />}/>
                </Tooltip>
              </span>
              <span style={{marginRight: '0.5rem', fontSize: '1.3rem'}}>Select a model:</span>
              <Select style={{width: '150px'}}
                value={currentModel} onSelect={modelChange}
                placeholder="from the list"
                options={models.map(model => {
                    return {value: model.name, label: model.name}
                })} />
              <span style={{marginLeft: '0.5rem', marginRight: '0.5rem', fontSize: '1.2rem'}}>Include Knowledge:</span>
              <Checkbox checked={useRag} onChange={toggleRag}/>
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
                        {isLastQuestion(index) ? <div style={{position: 'relative'}}>
                            <Flex style={{position: 'absolute', bottom: '-1.4rem', left: '0px'}} gap='small'>
                                <Tooltip title="Edit">
                                    <Button type="dashed" size="small" shape='circle' icon={<EditOutlined />} />
                                </Tooltip>
                                <Tooltip title="Regenerate">
                                    <Button type="dashed" size="small" shape='circle' icon={<RedoOutlined />} />
                                </Tooltip>
                            </Flex>
                        </div> : <></>}
                      </div>
                    </Flex>
                    <Divider></Divider>
                </div>
                })}
                {generating && <GeneratingResponseSection generatingText={generatingText} currentModel={currentModel} />}
            </div>:
            <NewChats setMessage={setMessage}/>}
        </div>
        
        <div style={{position: 'fixed', bottom: '0', width: '100%'}} id='chat-box-parent' ref={(el) => {
            if (el) {
                setChatboxTop(el.getBoundingClientRect().top);
            }
        }}>
          <ChatBox message={message} model={currentModel} width={chatboxWidth}
                   useRag={useRag} setUseRag={setUseRag}
                   setMessage={setMessage} setChatHistory={setChatHistory}
                   responseHandler={responseHandler}
                   generating={generating}
                   cancelRequest={cancelRequest}
                   setSizeChanged={setSizeChanged}/>
        </div>
    </div>
    )
}

export default ChatBoard