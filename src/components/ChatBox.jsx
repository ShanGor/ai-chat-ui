/* eslint-disable react/prop-types */
import {Button, Tooltip, Flex } from "antd"
import { useEffect, useState } from "react"
import {
    PlusOutlined,
    ArrowUpOutlined,
    CloseOutlined,
  } from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"
import { mainPaneParagraphColor } from "../App"
import Stop from '../assets/stop.svg'
import { textNotEmpty } from "../Utility";

const ChatBox = ({message, setMessage, images, setImages, submitMessage, width='80%', generating, cancelRequest, setSizeChanged}) => {
  const [height, setHeight] = useState(2)
  const [isFocused, setIsFocused] = useState(false)
  const [inputFieldRef, setInputFieldRef] = useState(null)

  
  useEffect(()=>{
    setSizeChanged()
  }, [images])

  useEffect(()=>{
    if (message) {
      if (!isFocused){
        const end = message?.length;
        inputFieldRef.setSelectionRange(end, end);
        inputFieldRef.focus()
        setIsFocused(true)
      }
    }
  }, [message])

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // Your action when "CTRL+Enter" is pressed
        event.preventDefault(); // Prevent default action if needed
        submitMessage()
    }
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

  const handleImageSelected = () => {
    if (!document.getElementById("chat-box-file-picker").files[0]) {
      return;
    }
    let selected = document.getElementById("chat-box-file-picker").files[0];
    let fileName = selected.name
    console.log("selected file name: ", fileName)
    let reader = new FileReader();
    if (fileName.endsWith('.pdf')) {
      // read pdf as text
    } else {
      reader.addEventListener("loadend", () => {
        let data = reader.result;
        setImages([...images, data]);
      });
      reader.readAsDataURL(selected);
    }
  }

  const getLeftWidth = () => {
    let boxWidth = document.getElementById('chatbox-div')?.getBoundingClientRect().width;
    let totalWidth = boxWidth / 0.9
    return Math.round((totalWidth - boxWidth) / 2) - 12
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

  return (<div style={{marginTop: '1rem', width: width, marginLeft: `${getLeftWidth()}px`}} id='chatbox-div'>
    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp"
           id="chat-box-file-picker" onChange={handleImageSelected} style={{display: 'none'}} />
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
                onFocus={() => {setIsFocused(true)}}
                onBlur={() => {setIsFocused(false)}}
                placeholder="Send a message (CTRL+Enter)"  onKeyDown={handleKeyDown}
                value={message} onChange={inputChanged}></textarea>
      <Flex style={{width: '4.6rem', borderRadius: '1rem', marginBottom: '0.1rem',}}>
        <Tooltip title='Record voice (Coming soon)'>
          <a style={{opacity: '0.6'}}>
            <img src={Microphone} alt="Microphone" style={{width: '1.5rem', marginLeft: '0.2rem', marginTop: '0.4rem'}} />
          </a>
        </Tooltip>
        {generating? 
        <a onClick={cancelRequest}><img src={Stop} alt="Stop" style={{width: '1.5rem', marginLeft: '0.2rem', marginTop: '0.3rem'}} /></a>
        :
        <Tooltip title={textNotEmpty(message) ? 'Send message' : 'Please enter a message'}>
        <Button shape="circle" type="text" disabled={!textNotEmpty(message)} id='submit-messsage'
                onClick={() => {submitMessage(message, images)}}
                className={textNotEmpty(message)?'send-button-valid':'send-button-invalid'}
                icon={<ArrowUpOutlined />} />
      </Tooltip>
        }

      </Flex>
    </Flex>
    </div>
    <div style={{opacity: '0.7', marginTop: '0.2rem'}}>LLMs can make mistakes. Verify important information.</div>
  </div>)
}

export default ChatBox