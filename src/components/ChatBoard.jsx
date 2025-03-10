import {Button, Checkbox, ConfigProvider, Divider, Flex, FloatButton, Modal, Select, Slider, Tooltip} from "antd"
import {useContext, useEffect, useState} from "react"
import {ChatUiContext} from "../App"
import {PieChartOutlined, PlusOutlined, SettingOutlined,} from '@ant-design/icons';
import ChatBox from "./ChatBox";
import {abbr, cancelGeneration, distinct, fetchEvents, textNotEmpty} from "../Utility";
import ChatBoardCurrentHistory from "./ChatBoardCurrentHistory.jsx";

let generatingTextCache = ''
let generatingBoxHeightCache=0

const promptVersion = '20240730'

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
    prompt: "You are a Professional Developer Assistant that will help software developers to accomplish tasks regarding coding, testing, architecture design, database design, data processing. You should answer questions using professional terms and give code examples (with Markdown code section including language info in lowercase) whenever possible by referencing below Documents quoted and separated in <doc></doc>. If you are not sure about the answer, you should answer:\"Sorry, I can only answer questions about Software Development.\".\n\nDocuments:\n"
  },
  {
    name: "BA",
    withRag: true,
    prompt: "As an AI assistant, you are required to act as a world-class product owner for a banking industry and help create elaborative user stories based on high-level business requirements. I want you to write comprehensive user stories which are distinct from each other. The user stories should be granular. DO NOT include any technical requirements. However, I would like you to create applicable non-functional requirements. DO NOT repeat the user stories. I also want you to provide acceptance criteria for every user story. Acceptance criteria could include specific features that need to be implemented, or specific performance metrics that need to be met. Your first ask is to create user stories based on the user input as high-level business requirement, and reference below documents quoted and separated in <doc></doc> as your knowledge base.\n\nDocuments:\n"
  },
  {
    name: "General",
    withRag: false,
    prompt: "As an AI assistant, please answer questions in professional manner.",
  },
  {
    name: "General",
    withRag: true,
    prompt: "Please answer questions by referencing the documents quoted and separated in <doc></doc>.\nDocuments:\n"
  },
]

export let llmOption = {
  temperature: 0.2,
  // max_tokens: 2048,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_new_tokens: null,
  repeat_penalty: null,
  top_k: null
}

let regenerating = false
let regenerateParam = {message: '', images: []}

let aboutToTriggerLlmCall = false
let aboutToTriggerLlmCallWithRag = false

// eslint-disable-next-line react/prop-types
const ChatBoard = ({collapsed, auth}) => {
  const [currentModel, setCurrentModel] = useState('qwen2.5:0.5b')
  const [currentRole, setCurrentRole] = useState('Developer')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingText, setGeneratingText] = useState('')
  const {currentChat, setCurrentChat, messageApi} = useContext(ChatUiContext)
  const [chatHistory, setChatHistory] = useState([])
  const [chatBoxTop, setChatBoxTop] = useState(0)
  const [selectModeBottom, setSelectModeBottom] = useState(0)
  const [contentPaneHeight, setContentPaneHeight] = useState('70vh')
  const [requestId, setRequestId] = useState('')
  const [chatBoxWidth, setChatBoxWidth] = useState('90%')
  const [useRag, setUseRag] = useState(false)
  const [doSettings, setDoSettings] = useState(false)
  const [temperature, setTemperature] = useState(0)
  const [settingConfig, setSettingConfig] = useState({
    role: null,
    withRag: false,
    prompt: ''
  })
  const [images, setImages] = useState([])
  const [textDocs, setTextDocs] = useState([])
  const [models, setModels] = useState([])
  const [showUsageDialog, setShowUsageDialog] = useState(false)



  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/tags`)
        .then((res) => res.json())
        .then((data) => {
          setModels(data.models);
          console.log("Models loaded", data.models)
        });

    if (localStorage.getItem('userRole')) {
      setCurrentRole(localStorage.getItem('userRole'))
    }
    // store / retrieve prompts
    if (localStorage.getItem('prompts')) {
      if (localStorage.getItem('prompt-version') && localStorage.getItem('prompt-version') >= promptVersion){
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
      llmOption = JSON.parse(localStorage.getItem('options'))
      setTemperature(llmOption.temperature)
    } else {
      setTemperature(llmOption.temperature)
      localStorage.setItem('options', JSON.stringify(llmOption))
    }

    window.addEventListener("resize", onPaneSizeChanged)
  }, [])

  useEffect(() => {
    if (models && models.length > 0) {
      // store / retrieve model
      if (localStorage.getItem('model')) {
        let oldModel = localStorage.getItem('model')
        for(let i in models) {
          if (models[i].name === oldModel) {
            setCurrentModel(oldModel)
            break
          }
        }
      }
    }
  }, [models]);

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

    if (regenerating) {
      regenerating = false
      generatingTextCache = ''
      generatingBoxHeightCache=0
      setGeneratingText(generatingTextCache)
      console.log("trying to submit for regenerating")
      submitMessage(regenerateParam.message, regenerateParam.images)
    }

    if (aboutToTriggerLlmCall && chatHistory.length > 0) {
      aboutToTriggerLlmCall = false
      responseHandler({})
      triggerAiChatCompletion(chatHistory).then()
    }

    if (aboutToTriggerLlmCallWithRag && chatHistory.length > 0) {
      aboutToTriggerLlmCallWithRag = false
      responseHandler({})
      let last = chatHistory[chatHistory.length-1]
      let refData = last.referenceData
      console.log("before calling triggerAiChatCompletionWithRag", last)
      triggerAiChatCompletionWithRag(chatHistory, last.content.message, last.images).then(data => data.map(o => refData.push(o)))
      setMessage('')
      setImages([])
      messageApi.open({
        type: 'warning',
        content: 'Converting your question to be embeddings.. Please be patient!',
      })
    }

  }, [chatHistory])

  useEffect(() => {
    if(!generating) {
      generatingTextCache = ''
      generatingBoxHeightCache=0
      setGeneratingText(generatingTextCache)
      console.log("Chat history is: ", chatHistory)
    }
  }, [generating])

  useEffect(() => {
    if (chatBoxTop > 0 && selectModeBottom > 0) {
      setContentPaneHeight(`${chatBoxTop - selectModeBottom + 20}px`)
    }
  }, [chatBoxTop, selectModeBottom])

  useEffect(() => {
    onPaneSizeChanged()
  }, [collapsed])

  const onPaneSizeChanged = () => {
    let mainPane = document.getElementById('chat-board-main')
    if (mainPane) {
      let totalWidth = mainPane.getBoundingClientRect().width
      let targetWidth = `${Math.round(totalWidth * 0.9)}px`
      setChatBoxWidth(targetWidth)
      // console.log("target width is", targetWidth)
    }
  }

  const modelChange = (value) => {
    localStorage.setItem('model', value)
    setCurrentModel(value)
  }

  const userRoleChange = (value) => {
    localStorage.setItem('userRole', value)
    setCurrentRole(value)
  }

  const regenerateResult = (idx) => {
    let msg = chatHistory[idx].content.message
    let img = []
    if (chatHistory[idx].images && chatHistory[idx].images.length > 0) {
      img = chatHistory[idx].images
    }
    regenerateParam.message = msg
    regenerateParam.images = img
    console.log("regenerateParam", regenerateParam)
    regenerating = true
    setChatHistory(hist => hist.slice(0, idx))
  };

  const nowSupportImage = () => {
    for (let i=0; i < models.length; i++) {
      let m = models[i];
      if (m.name === currentModel) {
        return m.supportImage
      }
    }
    return false
  }




  const submitMessage = (message, images)=> {
    if (!textNotEmpty(message)){
      messageApi.open({
        type: 'error',
        content: 'Please enter a message before sending',
      });
      return
    }

    if (!currentModel) {
      messageApi.open({
        type: 'error',
        content: 'Please select a model before sending messages',
      });
    } else {
      if (useRag) {
        aboutToTriggerLlmCallWithRag = true
        setChatHistory(hist => {
          return [...hist, {
            role: 'user',
            content: {
              created_at: new Date().toLocaleString(),
              message: message?.trim(),
              model: currentModel
            },
            images: images,
            textDocs: textDocs,
            referenceData: []
          }]
        })
      } else {
        aboutToTriggerLlmCall = true
        setChatHistory(hist => {
          return [...hist, {
            role: 'user',
            content: {
              created_at: new Date().toLocaleString(),
              message: message?.trim(),
              model: currentModel
            },
            images: images,
            textDocs: textDocs
          }]
        })
        setMessage('')
        setImages([])
        setTextDocs([])
      }
    }
  }


  const triggerAiChatCompletion = async (hist, withRag=false) => {
    console.log("====** calling triggerAiChatCompletion")
    let request
    if (hist.length > 0) {
      let requestMessages = []
      if (!withRag) {
        requestMessages.push({
          role: "system",
          content: UserRoles.filter(o => o.name === currentRole && o.withRag === false)[0].prompt
        })
      }

      let supportImage = nowSupportImage()
      hist.map(o => {
        let msg = {
          role: o.role,
          content: o.content.message
        }
        if (supportImage && o.images) {
          msg.images = o.images // No need to trim it because we are using GPT4, which remains the data:image/png;base64,
        }
        if (o.textDocs.length > 0) {
          msg.content = o.content.message + "\n<docs><doc>\n" + o.textDocs.join("\n</doc><doc>\n") + "\n</doc>\n</docs>"
        }
        requestMessages.push(msg)
      })
      request = {
        model: currentModel,
        messages: requestMessages,
        stream: true,
        options: llmOption
      }
    }

    fetchEvents(`${import.meta.env.VITE_API_URL}/chat/ollama`, (text) => {
      // console.log("got text", text)
      try {
        let o = JSON.parse(text)
        responseHandler(o)
      } catch(e) {
        console.log("error parsing", text)
        console.log("error details: ", e)
      }
    }, JSON.stringify(request))
  }

  const findByEmbeddings = async (resp) => {
    return fetch(`${import.meta.env.VITE_API_URL}/find-by-embedding/5`, {
      method: 'POST',
      body: await resp.text()
    })
  }
  const triggerAiChatCompletionWithRag = async (hist, message, images) => {
    console.log("====** calling triggerAiChatCompletionWithRag")
    let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/embedding`, {
      method: 'POST',
      body: message?.trim()
    })
    if (resp.status !== 200 ) {
      messageApi.open({
        type: 'error',
        content: `Failed to convert your input to be embedding: ${await resp.text()}`,
      });
      return null
    }

    messageApi.open({
      type: 'warning',
      content: 'Searching relevant docs by embedding..',
    })
    resp = await findByEmbeddings(resp)
    let data = await resp.json()
    console.log("Embedding Data:", data)

    messageApi.open({
      type: 'success',
      content: 'Got documents! Thinking and answering your question..',
    });
    // console.log("embeddings", data)
    if (data) {
      let rag_prompt = UserRoles.filter(o => o.name === currentRole && o.withRag === true)[0].prompt
      for (let i=0; i<data.length; i++){
        let e = data[i]
        rag_prompt += `<doc>${e.text}</doc>\n`
      }
      console.log("rag_prompt", rag_prompt)
      let messages = [{
        role: 'system',
        content: {
          created_at: new Date().toLocaleString(),
          message: rag_prompt.trim(),
          model: currentModel
        },
        images: images
      }, ...hist]
      responseHandler({})
      triggerAiChatCompletion(messages, true).then()
      setUseRag(false)
      return data
    } else {
      setChatHistory(hist => {
        return [...hist, {
          role: 'assistant',
          content: {
            created_at: new Date().toLocaleString(),
            message: 'Sorry, I am not able to find the answer to your question',
            model: currentModel
          },
          images: []
        }]
      })
      setMessage('')
      setImages([])
      return null
    }
  }

  const onSettingChoiceChange = (obj) => {
    let old = {...settingConfig}
    if (obj.role) {
      old.role = obj.role
    } else {
      old.withRag = obj.withRag
    }
    old.prompt = UserRoles.filter(o => o.name === old.role && o.withRag == old.withRag)[0].prompt
    setSettingConfig(old)
  }

  const onSettingPromptChanged = (promptStr) => {
    let old = {...settingConfig}
    old.prompt = promptStr
    setSettingConfig(old)
  }

  const onConfirmChangePrompt = () => {
    for (let i=0; i<UserRoles.length; i++) {
      let o = UserRoles[i]
      if (o.withRag === settingConfig.withRag && o.name === settingConfig.role) {
        UserRoles[i].prompt = settingConfig.prompt
        localStorage.setItem('prompts', JSON.stringify(UserRoles))
        break
      }
    }
    setDoSettings(false)
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
    setChatBoxTop(document.getElementById('chat-box-parent').getBoundingClientRect().top)
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
      // console.log("now cache is: ", generatingTextCache)
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
      console.log("done as: ", generatingTextCache)
      setChatHistory(old => {
        return [...old, {
          content: {
            message: generatingTextCache,
            model: data.model,
            created_at: data.created_at
          },
          role: 'assistant',
        }]
      })
      setGenerating(false)
      // generatingTextCache = ''
      generatingBoxHeightCache=0
      // setGeneratingText(generatingTextCache)
    }
  }





  return (<div className="center" id='chat-board-main'>
        <div style={{top: '2.65rem', left: '16rem', position: 'fixed', width: '80%'}} ref={(el) => {
          if (el) {
            setSelectModeBottom(el.getBoundingClientRect().bottom);
          }
        }}>
          <Divider orientation='center'>
                <span style={{marginRight: '0.5rem'}}>
                  <Tooltip title='Create a new chat'>
                    <Button size="middle" style={{color: 'white', backgroundColor: 'green'}}
                            onClick={() => {
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
            <span style={{marginLeft: '0.5rem', marginRight: '0.5rem', fontSize: '1rem'}}>Include Knowledge:</span>
            <Checkbox checked={useRag} onChange={(e) => {
              setUseRag(e.target.checked)}}/>

            <Tooltip style={{marginLeft:'0.2rem'}} title='Settings' placement='bottom'>
              <Button shape='circle' type="text" icon={<SettingOutlined />} size="large" onClick={() => {setDoSettings(true)}} />
            </Tooltip>

          </Divider>
        </div>
        <div style={{ marginTop: '3.5rem', height: contentPaneHeight, width: '100%', overflowY: 'scroll', overflowX: 'hidden'}}>
          <ChatBoardCurrentHistory chatHistory={chatHistory}
                                   setChatHistory={setChatHistory}
                                   generating={generating}
                                   generatingText={generatingText}
                                   currentModel={currentModel}
                                   setMessage={setMessage}
                                   regenerateResult={regenerateResult} />
        </div>

        <div style={{position: 'fixed', bottom: '0', width: '100%'}} id='chat-box-parent' ref={(el) => {
          if (el) {
            setChatBoxTop(el.getBoundingClientRect().top);
          }
        }}>
          <ChatBox
              message={message}
              setMessage={setMessage}
              images={images}
              setImages={setImages}
              textDocs={textDocs}
              setTextDocs={setTextDocs}
              submitMessage={submitMessage}
              width={chatBoxWidth}
              generating={generating}
              cancelRequest={cancelRequest}
              setChatHistory={setChatHistory}
              setSizeChanged={setSizeChanged}/>
        </div>
        <Modal title="Config Your Local settings" open={doSettings} onOk={() => {onConfirmChangePrompt()}} onCancel={() => {setDoSettings(false)}}>
          <h4>Options</h4>
          <Flex gap='small'>
            <div>Temperature: <span style={{fontStyle: "italic"}}>Accurate</span></div>
            <div style={{marginTop: '-0.2rem'}}>
              <Slider style={{width: '150px'}} value={temperature} step={0.1} min={0.1} max={0.9}
                      onChange={v => {
                        setTemperature(v)
                        llmOption.temperature = v
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

        <ConfigProvider theme={{
          token: {
            colorPrimary: 'green'
          }
        }}>
          <FloatButton.Group
              trigger='hover'
              style={{marginBottom: '10%'}}>
            <FloatButton type='default'
                         tooltip='Summary of usage'
                         onClick={() => setShowUsageDialog(true)}
                         icon={<PieChartOutlined />}/>
          </FloatButton.Group>

        </ConfigProvider>

      </div>
  )
}

export default ChatBoard