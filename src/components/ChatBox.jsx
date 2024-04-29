import {Select, Button, Tooltip, Flex, Typography } from "antd"
import { useState, useEffect } from "react"
import {
    PlusOutlined,
    ArrowUpOutlined,
    CloseOutlined,
  } from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"
import { mainPaneParagraphColor } from "../App"

const ChatBox = () => {
  const [height, setHeight] = useState(2)
  const [lines, setLines] = useState('')
  const [images, setImages] = useState([])

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
    setLines(text)
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
    let reader = new FileReader();
    reader.addEventListener("loadend", () => {
      let data = reader.result;
      setImages([...images, data]);
    });
    reader.readAsDataURL(selected);
  }

  const imageCard = (image, index) => {
    return (<div className="image-card" key={index}>
      <div style={{zIndex: '1', paddingTop: '0.5rem',}}>
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
      <textarea style={inputStyle()} placeholder="Send a message" value={lines} onChange={inputChanged}></textarea>
      <Flex style={{width: '4.6rem', borderRadius: '1rem', marginBottom: '0.1rem',}}>
        <Tooltip title='Record voice'>
          <a style={{opacity: '0.6'}}>
            <img src={Microphone} alt="Microphone" style={{width: '1.5rem', marginLeft: '0.2rem', marginTop: '0.4rem'}} />
          </a>
        </Tooltip>
        <Tooltip title='Send message'>
          <Button shape="circle" type="text" style={{color: 'white',
             backgroundColor: 'black', marginRight: '0rem',
             borderBlockColor: 'black'}} icon={<ArrowUpOutlined />} />
        </Tooltip>
      </Flex>
    </Flex>
    </div>
    <div style={{opacity: '0.7', marginTop: '0.2rem'}}>LLMs can make mistakes. Verify important information.</div>
  </div>)
}

export default ChatBox