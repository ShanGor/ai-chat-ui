import {useContext, useEffect, useState} from "react"
import {ChatUiContext, UserRoles} from "../App"
import ChatBox from "./ChatBox";
import {abbr, cancelGeneration, fetchEvents, getCurrentTimeAsFormatted, textNotEmpty} from "../Utility";
import ChatBoardCurrentHistory from "./ChatBoardCurrentHistory.jsx";

let generatingTextCache = ''
let generatingBoxHeightCache=0


let regenerating = false
let regenerateParam = {message: '', images: []}

let aboutToTriggerLlmCall = false
let aboutToTriggerLlmCallWithRag = false

// eslint-disable-next-line react/prop-types
const ChatBoard = ({collapsed, currentModel, currentRole}) => {
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingText, setGeneratingText] = useState('')
  const {currentChat, setCurrentChat, messageApi, llmOption} = useContext(ChatUiContext)
  const [chatHistory, setChatHistory] = useState([])
  const [chatBoxTop, setChatBoxTop] = useState(0)
  const [selectModeBottom, setSelectModeBottom] = useState(0)
  const [contentPaneHeight, setContentPaneHeight] = useState('70vh')
  const [requestId, setRequestId] = useState('')
  const [chatBoxWidth, setChatBoxWidth] = useState('90%')
  const [useRag, setUseRag] = useState(false)
  const [ragTopK, setRagTopK] = useState(3)

  const [images, setImages] = useState([])
  const [textDocs, setTextDocs] = useState([])
  const [includeChatHistory, setIncludeChatHistory] = useState(5)



  useEffect(() => {
    window.addEventListener("resize", onPaneSizeChanged)
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

    if (aboutToTriggerLlmCall && chatHistory.length > 0) {
      console.log("about to triggerLlmCall", chatHistory)
      aboutToTriggerLlmCall = false
      responseHandler(null)
      triggerAiChatCompletion(chatHistory).then()
    }

    if (aboutToTriggerLlmCallWithRag && chatHistory.length > 0) {
      aboutToTriggerLlmCallWithRag = false
      responseHandler(null)
      // let last = chatHistory[chatHistory.length-1]
      // let refData = last.referenceData
      // console.log("before calling triggerAiChatCompletionWithRag", last)
      triggerAiChatCompletionWithRag(chatHistory).then()//.then(data => data.map(o => refData.push(o)))
      setMessage('')
      setImages([])
    }

    if (regenerating) {
      regenerating = false
      generatingTextCache = ''
      generatingBoxHeightCache=0
      setGeneratingText(generatingTextCache)
      console.log("trying to submit for regenerating")
      submitMessage(regenerateParam.message, regenerateParam.images)
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
      setContentPaneHeight(`${chatBoxTop - selectModeBottom}px`)
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
      setGenerating(true)
      let hist;
      if (useRag) {
        aboutToTriggerLlmCallWithRag = true
        hist = [...chatHistory, {
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

      } else {
        aboutToTriggerLlmCall = true
        hist = [...chatHistory, {
          role: 'user',
          content: {
            created_at: new Date().toLocaleString(),
            message: message?.trim(),
            model: currentModel
          },
          images: images,
          textDocs: textDocs
        }]
      }
      setChatHistory(hist)
      setMessage('')
      setImages([])
      setTextDocs([])
    }
  }


  const triggerAiChatCompletion = async (hist, withRag=false) => {
    console.log("====** calling triggerAiChatCompletion")
    let request
    if (hist.length > 0) {
      let requestMessages = []
      if (!withRag) {
        let prompt = UserRoles.filter(o => o.name === currentRole && o.withRag === false)[0].prompt
        if (prompt) {
          requestMessages.push({
            role: "system",
            content: prompt
          })
        }
      }

      hist.map(o => {
        let msg = {
          role: o.role,
          content: o.content.message
        }
        if (o.images) {
          msg.images = o.images // No need to trim it because we are using GPT4, which remains the data:image/png;base64,
        }
        if (o.textDocs?.length > 0) {
          msg.content += '\n\n# Attached Documents:\n'
          msg.content += "\n<docs><doc>\n" + o.textDocs.join("\n</doc><doc>\n") + "\n</doc>\n</docs>"
        }
        if (o.referenceData?.length > 0) {
          msg.content += '\n\n# Below are the context documents quoted in <context></context> and separated by <doc></doc> for your reference to help to answer the question above, sorted by relevance ranking descending, some of the doc might be irrelevant, please ignore if irrelevant:\n'
          msg.content += "\n<context>\n<doc>\n" + o.referenceData.map(o => o.text.trim()).join("\n</doc>\n<doc>\n") + "\n</doc>\n</context>"
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

    generatingTextCache = ''
    fetchEvents(`${import.meta.env.VITE_API_URL}/api/chat`, (evt) => {
      // console.log("got text", text)
      try {
        responseHandler(evt)
      } catch(e) {
        console.log("error parsing", text)
        console.log("error details: ", e)
      }
    }, JSON.stringify(apiRequestConvert(request)))
  }

  const apiRequestConvert = (data) => {
    let request = {model: data.model, stream: data.stream, messages: [], ...llmOption}
    for (let i in data.messages) {
      let msg = data.messages[i]
      let newMsg = {role: msg.role}
      if (msg.images?.length > 0) {
        newMsg.content = []
        let textContent = msg.content
        newMsg.content.push({type: 'text', text: textContent})
        for (let j in msg.images) {
          let img = msg.images[j]
          newMsg.content.push({type: 'image_url', image_url: {url: img}})
        }
      } else {
        newMsg.content = msg.content
      }
      request.messages.push(newMsg)
    }
    return {
      request: request,
      options: {
        useRag: useRag,
        ragTopK: ragTopK,
        includeHistoryCount: includeChatHistory,
      }
    }
  }

  const findByEmbeddings = async (resp) => {
    let payload;
    if (typeof resp === 'string') {
      payload = resp
    } else {
      payload = await resp.text()
    }
    return fetch(`${import.meta.env.VITE_API_URL}/api/find-embeddings/${ragTopK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload
    })
  }
  const triggerAiChatCompletionWithRag = async (hist) => {
    console.log("====** calling triggerAiChatCompletionWithRag")
    let last = hist[chatHistory.length-1]
    let message = last.content?.message
    // let refData = last.referenceData

    messageApi.open({
      type: 'warning',
      content: 'Searching relevant docs by embedding..',
    })
    let resp = await findByEmbeddings(message?.trim())
    if (!resp.ok) {
      messageApi.open({
        type: 'error',
        content: `Failed to find relevant docs: ${await resp.text()}`,
      });
      return null
    }

    let data = await resp.json()
    console.log("Embedding Data:", data)

    messageApi.open({
      type: 'success',
      content: 'Got documents! Thinking and answering your question..',
    });
    // console.log("embeddings", data)
    if (data) {
      let rag_prompt = UserRoles.filter(o => o.name === currentRole && o.withRag === true)[0].prompt
      // rag_prompt += '<docs>\n'
      // for (let i=0; i<data.length; i++){
      //   let e = data[i]
      //   rag_prompt += `<doc>${e.text?.trim()}</doc>\n`
      // }
      // rag_prompt += '</docs>'
      console.log("rag_prompt", rag_prompt)
      last.referenceData = data
      let messages
      if (rag_prompt) {
        messages = [{
          role: 'system',
          content: {
            created_at: new Date().toLocaleString(),
            message: rag_prompt.trim(),
            model: currentModel
          }
        }, ...hist]
      } else {
        messages = [...hist]
      }
      responseHandler(null)
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

  const cancelRequest = () => {
    cancelGeneration()

    fetch(`${import.meta.env.VITE_API_URL}/api/cancel/${requestId}`).then(resp => {
      if (resp.status === 200) {
        console.log('Request cancelled')
      }
    }).then(()=>setTimeout(() => {
      setGenerating(false)
      responseHandler("DONE")
    }, 100))

  }

  const setSizeChanged = () => {
    // console.log('size changed, pls check')
    setChatBoxTop(document.getElementById('chat-box-parent').getBoundingClientRect().top)
  }

  const responseHandler = (evt) => {
    let text = evt?.data || evt

    if (!text) return
    if ("DONE" === text) {
      console.log("done as: ", generatingTextCache)
      setChatHistory(old => {
        return [...old, {
          content: {
            message: generatingTextCache,
            model: currentModel,
            created_at: getCurrentTimeAsFormatted()
          },
          role: 'assistant',
        }]
      })
      setGenerating(false)
      // generatingTextCache = ''
      generatingBoxHeightCache=0
      // setGeneratingText(generatingTextCache)
      return;
    }
    let data = {}
    try {
      if ("string" === typeof text) {
        data = JSON.parse(text)
      } else if ("object" === typeof text)  {
        data = text
      } else {
        console.log("error parsing", text)
      }
    } catch (e) {
      console.log("error parsing", text, 'error is', e)
    }
    // console.log("got data", data)
    setGenerating(true)

    if (data?.id) {
      setRequestId(data.id)
    }

    if (data?.choices?.length > 0) {
      for (let i in data.choices) {
        if (data.choices[i].delta?.content) {
          generatingTextCache += data.choices[i].delta.content
          // console.log("now cache is: ", generatingTextCache)
          setGeneratingText(generatingTextCache)
        }
      }

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
  }


  return (<div className="center" id='chat-board-main'>
        <div style={{marginTop: '0.8rem', left: '16rem', width: '80%'}} ref={(el) => {
          if (el) {
            setSelectModeBottom(el.getBoundingClientRect().bottom);
          }
        }}>
        </div>
        <div style={{height: contentPaneHeight, width: '100%', overflowY: 'scroll', overflowX: 'hidden'}}>
          <ChatBoardCurrentHistory chatHistory={chatHistory}
                                   setChatHistory={setChatHistory}
                                   generating={generating}
                                   generatingText={generatingText}
                                   currentModel={currentModel}
                                   currentRole={currentRole}
                                   setMessage={setMessage}
                                   regenerateResult={regenerateResult} />
        </div>

        <div style={{position: 'fixed', bottom: '0', width: '100%'}} id='chat-box-parent' ref={(el) => {
          if (el) {
            setChatBoxTop(el.getBoundingClientRect().top);
          }
        }}>
          <ChatBox
              message={message} setMessage={setMessage}
              images={images} setImages={setImages}
              includeChatHistory={includeChatHistory} setIncludeChatHistory={setIncludeChatHistory}
              useRag={useRag} setUseRag={setUseRag} ragTopK={ragTopK} setRagTopK={setRagTopK}
              textDocs={textDocs} setTextDocs={setTextDocs}
              submitMessage={submitMessage}
              width={chatBoxWidth}
              generating={generating}
              cancelRequest={cancelRequest}
              setChatHistory={setChatHistory}
              setSizeChanged={setSizeChanged}/>
        </div>

      </div>
  )
}

export default ChatBoard