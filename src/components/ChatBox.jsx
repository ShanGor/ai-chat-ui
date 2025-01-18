import {Button, Tooltip, Flex, Modal, Radio, Image, Spin} from "antd"
import {useEffect, useState} from "react"
import {
  PlusOutlined,
  ArrowUpOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"
import {mainPaneParagraphColor} from "../App"
import Stop from '../assets/stop.svg'
import {textNotEmpty} from "../Utility";
import {getPageText} from "../PdfUtil.js";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { pdfjs } from 'react-pdf';

// eslint-disable-next-line react/prop-types
const ChatBox = ({message, setMessage, images, setImages, submitMessage, width='80%', generating, cancelRequest, setSizeChanged}) => {
  const [height, setHeight] = useState(2)
  const [isFocused, setIsFocused] = useState(false)
  const [inputFieldRef, setInputFieldRef] = useState(null)
  const [showPdfOption, setShowPdfOption] = useState(false)
  const [currentPdf, setCurrentPdf] = useState(null)
  const [pdfOption, setPdfOption] = useState(2)
  const [readingPdf, setReadingPdf] = useState(false)

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

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            setImages((prevImages) => [...prevImages, event.target.result]);
          };
          reader.readAsDataURL(blob);
        }
      }
    };

    document.addEventListener('click', function(e) {
      if (!e.target.matches('#myTextarea, #suggestionBox, #suggestionBox li')) {
        hideSuggestions();
      }
    });

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('click', undefined);
    };
  }, []);

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      // Your action when "CTRL+Enter" is pressed
      event.preventDefault(); // Prevent default action if needed
      submitMessage(message, images)
    } else if (event.key === '/' ) {
      const textarea = event.target;
      const cursorPosition = textarea.selectionStart;
      // event.preventDefault()
      showSuggestions(textarea, cursorPosition);
    }
  }

  function showSuggestions(textarea, cursorPosition) {
    const suggestions = ['/Coming soon 1', '/Coming soon 2', '/Coming soon 3']; // Example suggestions
    const suggestionBox = document.getElementById('suggestionBox');
    suggestionBox.innerHTML = '';
    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      li.onclick = function() {
        insertTextAtPosition(textarea, cursorPosition, suggestion);
        hideSuggestions();
      };
      suggestionBox.appendChild(li);
    });
    suggestionBox.classList.remove('hide');
  }
  function hideSuggestions() {
    const suggestionBox = document.getElementById('suggestionBox');
    suggestionBox.classList.add('hide');
  }

  function insertTextAtPosition(textarea, position, text) {
    const textBefore = textarea.value.substring(0, position);
    const textAfter = textarea.value.substring(position);
    textarea.value = textBefore + text + textAfter;
    textarea.selectionStart = textarea.selectionEnd = position + text.length;
    setMessage(textBefore + text + textAfter);
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
      let lineCount = chunks.length > 5 ? 5 : chunks.length
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
      // read pdf as text, or read as images
      reader.addEventListener("loadend", () => {
        let data = reader.result;
        setCurrentPdf(data)
        setShowPdfOption(true)
      });
      reader.readAsDataURL(selected);
    } else {
      reader.addEventListener("loadend", () => {
        let data = reader.result;
        setImages([...images, data]);
      });
      reader.readAsDataURL(selected);
    }
  }

  const readPdfAsImagesOrText = async() => {
    setReadingPdf(true)
    const canvas = document.getElementById('the-canvas');
    const context = canvas.getContext('2d');
    let pdf = await pdfjs.getDocument({url: currentPdf} ).promise
    for (let i = 1; i <= pdf.numPages; i++) {
      let page = await pdf.getPage(i)
      if (pdfOption === 1) {
        // read pdf as images
        const viewport = page.getViewport({scale: 1});
        canvas.height= viewport.height;
        canvas.width= viewport.width;
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        setImages(old=>{return [...old, canvas.toDataURL()]});
      } else if (pdfOption === 2) {
        // read pdf as text
        let text = await getPageText(page)
        setMessage(old => `${old}\n${text}`)
      }

    }
    setCurrentPdf(null)
    setShowPdfOption(false)
    setPdfOption(2)
    setReadingPdf(false)
  }

  const getLeftWidth = () => {
    let boxWidth = document.getElementById('chatbox-div')?.getBoundingClientRect().width;
    let totalWidth = boxWidth / 0.9
    return Math.round((totalWidth - boxWidth) / 2) - 12
  }

  const imageCard = (image, index) => {
    return (<div className="image-card" key={index}>
      <div style={{paddingTop: '0.5rem',}}>
        <Image src={image} alt="Image" style={{borderRadius: '0.5rem', width: '4rem', height: '4rem', objectFit: 'cover'}} />
      </div>

      <div className="close-image-container">
        <a onClick={() => {removeImage(index)}}><CloseOutlined className="close-image-icon"/></a>
      </div>
    </div>)
  }

  return (<div style={{marginTop: '1rem', width: width, marginLeft: `${getLeftWidth()}px`}} id='chatbox-div'>
    <input type="file" id="chat-box-file-picker" accept="application/pdf,image/xbm,image/jfif,image/gif,image/svg,image/jpeg,image/jpg,image/svgz,image/webp,image/png,image/bmp,image/pjp,image/apng,image/pjpeg,image/avif"
           onChange={handleImageSelected} style={{display: 'none'}}></input>
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
        <ul id="suggestionBox" className="suggestions hide"></ul>

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
                <Button shape="circle" type="text" disabled={!textNotEmpty(message)}
                        onClick={() => submitMessage(message, images)}
                        className={textNotEmpty(message)?'send-button-valid':'send-button-invalid'}
                        icon={<ArrowUpOutlined />} />
              </Tooltip>
          }

        </Flex>
      </Flex>
    </div>
    <div style={{opacity: '0.7', marginTop: '0.2rem'}}>LLMs can make mistakes. Verify important information.</div>
    <Modal title="Upload PDF as images or text?"
           open={showPdfOption} onOk={readPdfAsImagesOrText}
           okButtonProps={{disabled: readingPdf}}
           onCancel={() => {setShowPdfOption(false)}} okText="Okay" cancelText="Cancel">
      <div style={{textAlign: 'center'}}>
        <Radio.Group onChange={(e) => {setPdfOption(e.target.value)}} value={pdfOption}>
          <Radio value={1}>Images</Radio>
          <Radio value={2}>Text</Radio>
        </Radio.Group>
      </div>
      <div style={{display: readingPdf?'block':'none', marginTop: '1rem'}} className='center'>
        <Spin size='large'/>
      </div>
    </Modal>
    <div style={{display: 'none'}}>
      <canvas id="the-canvas"></canvas>
    </div>
  </div>)
}

export default ChatBox