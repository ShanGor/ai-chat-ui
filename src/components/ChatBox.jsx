import {Button, Tooltip, Flex } from "antd"
import { useContext, useEffect, useState } from "react"
import {
    PlusOutlined,
    ArrowUpOutlined,
    CloseOutlined,
  } from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"
import { ChatUiContext, mainPaneParagraphColor } from "../App"
import { fetchEvents, trimImageMeta } from "../Utility";

const ChatBox = ({message, setMessage, model, setSizeChanged, setChatHistory, responseHandler}) => {
  const [height, setHeight] = useState(2)
  const [images, setImages] = useState([])
  const {messageApi} = useContext(ChatUiContext)
  const [inputFieldRef, setInputFieldRef] = useState(null)

  const submitMessage = ()=> {
    if (!gotSomeMessage()) {
      messageApi.open({
        type: 'error',
        content: 'Please enter a message before sending',
      });
      return
    }

    if (!model) {
      messageApi.open({
        type: 'error',
        content: 'Please select a model before sending messages',
      });
    } else {
      setChatHistory(hist => {
        let newHist = [...hist, {
          role: 'user',
          content: {
            created_at: new Date().toLocaleString(),
            message: message.trim(),
            model: model
          },
          images: images
        }]
        responseHandler({})
        triggerAiChatCompletion(newHist)
        return newHist
      })
      setMessage('')
      setImages([])
    }
  }

  useEffect(()=>{
    setSizeChanged()
  }, [images])

  useEffect(()=>{
    if (message) {
      const end = message.length;
      inputFieldRef.setSelectionRange(end, end);
      inputFieldRef.focus()
    }
  }, [message])

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // Your action when "CTRL+Enter" is pressed
        event.preventDefault(); // Prevent default action if needed
        submitMessage()
    }
  }


  const triggerAiChatCompletion = (hist) => {
    let request
    if (hist.length > 0) {
      let requestMessages = []
      hist.map(o => {
        let msg = {
          role: o.role,
          content: o.content.message
        }
        if (o.images) {
          msg.images = trimImageMeta(o.images)
        }
        requestMessages.push(msg)
      })
      request = {
        model: model,
        messages: requestMessages,
        stream: true
      }

    }

    fetchEvents(`${import.meta.env.VITE_API_URL}/chat/ollama`, (text) => {
      // console.log("got text", text)
      responseHandler(JSON.parse(text))
    }, JSON.stringify(request))
  }

  const inputStyle = () => {
    return  {
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
      border: 0,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      resize:'none',
      outline: 'none',
      width: '100%',
      height: `${height}rem`,
      minHeight: '2.5rem',
      color: mainPaneParagraphColor
    }
  }

  const inputChanged = (e) => {
    let text = e.target.value
    setMessage(text)
    if (text && text.length > 0) {
      const chunks = text.split(/\r\n|\r|\n/);
      var lineCount = chunks.length > 5 ? 5 : chunks.length
      setHeight(lineCount * 1.5 + 1)
    } else {
      setHeight(1.5)
    }
  }

  const uploadImage = () => {
    document.getElementById("chat-box-file-picker").click()
  }

  const removeImage = (index) => {
    setImages(images.filter((_, idx) => idx !== index))
    document.getElementById("chat-box-file-picker").value=null
  }

  const gotSomeMessage = () => {
    if (message && message.trim().length > 0) {
      return true
    }
    return false
  }

  const handleImageSelected = () => {
    if (!document.getElementById("chat-box-file-picker").files[0]) {
      return;
    }
    let selected = document.getElementById("chat-box-file-picker").files[0];
    let reader = new FileReader();
    reader.addEventListener("loadend", () => {
      let data = reader.result;
      setImages([...images, data]);
    });
    reader.readAsDataURL(selected);
  }

  const imageCard = (image, index) => {
    return (<div className="image-card" key={index}>
      <div style={{paddingTop: '0.5rem',}}>
        <img src={image} alt="Image" style={{borderRadius: '0.5rem', width: '4rem', height: '4rem', objectFit: 'cover'}} />
      </div>
      
      <div className="close-image-container">
        <a onClick={() => {removeImage(index)}}><CloseOutlined className="close-image-icon"/></a>
      </div>
    </div>)
  }

  return (<div style={{marginTop: '1rem'}}>
    <input type="file" id="chat-box-file-picker" onChange={handleImageSelected} style={{display: 'none'}}></input>
    <div className="center" style={{border: '1px solid #ccc', width: '95%', borderRadius: '1rem', backgroundColor: 'white', }}>
      <div style={{width: '100%', borderRadius: '1rem', display: `${images.length > 0 ? 'block' : 'none'}`}}>
        <Flex style={{marginBottom: '0.5rem', marginLeft: '0.5rem'}} gap='small' wrap="wrap">
          {images.map((image, index) => imageCard(image, index))}
        </Flex>
      </div>
    <Flex align="flex-end">
      <div style={{width: '2.6rem', borderRadius: '1rem',}}>
        <Tooltip title='Upload images'>
          <Button shape="circle" onClick={uploadImage} type="text" icon={<PlusOutlined />} style={{marginLeft: '0rem', marginBottom: '0.25rem'}} />
        </Tooltip>
      </div>
      <textarea style={inputStyle()} ref={el => setInputFieldRef(el)} id='chat-input-field'
                placeholder="Send a message (CTRL+Enter)"  onKeyDown={handleKeyDown}
                value={message} onChange={inputChanged}></textarea>
      <Flex style={{width: '4.6rem', borderRadius: '1rem', marginBottom: '0.1rem',}}>
        <Tooltip title='Record voice (Coming soon)'>
          <a style={{opacity: '0.6'}}>
            <img src={Microphone} alt="Microphone" style={{width: '1.5rem', marginLeft: '0.2rem', marginTop: '0.4rem'}} />
          </a>
        </Tooltip>
        <Tooltip title={gotSomeMessage() ? 'Send message' : 'Please enter a message'}>
          <Button shape="circle" type="text" disabled={!gotSomeMessage()}
                  onClick={submitMessage}
                  className={gotSomeMessage()?'send-button-valid':'send-button-invalid'}
                  icon={<ArrowUpOutlined />} />
        </Tooltip>
      </Flex>
    </Flex>
    </div>
    <div style={{opacity: '0.7', marginTop: '0.2rem'}}>LLMs can make mistakes. Verify important information.</div>
  </div>)
}

export default ChatBox