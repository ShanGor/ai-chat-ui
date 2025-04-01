import {
  Button,
  Tooltip,
  Flex,
  Switch,
  ConfigProvider,
  FloatButton,
  Select, Input
} from "antd"
import {useContext, useEffect, useState} from "react"
import {
  PlusOutlined,
  ArrowUpOutlined, PieChartOutlined,
} from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"
import {ChatUiContext, mainPaneParagraphColor} from "../App"
import Stop from '../assets/stop.svg'
import {textNotEmpty} from "../Utility";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import {uploadImage, UploadImage} from "./UploadImage.jsx";

// eslint-disable-next-line react/prop-types
const ChatBox = ({message, setMessage,
                  images, setImages,
                  includeChatHistory, setIncludeChatHistory,
                  useRag, setUseRag, ragTopK, setRagTopK,
                  textDocs, setTextDocs,
                  submitMessage, width='80%', generating, cancelRequest, setSizeChanged}) => {
  const [height, setHeight] = useState(2)
  const [isFocused, setIsFocused] = useState(false)
  const [inputFieldRef, setInputFieldRef] = useState(null)
  const {llmOption, setLlmOption} = useContext(ChatUiContext)

  const [showUsageDialog, setShowUsageDialog] = useState(false)

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


  const getLeftWidth = () => {
    let boxWidth = document.getElementById('chatbox-div')?.getBoundingClientRect().width;
    let totalWidth = boxWidth / 0.9
    return Math.round((totalWidth - boxWidth) / 2) - 12
  }

  return (<div style={{marginTop: '0.2rem', width: width, marginLeft: `${getLeftWidth()}px`}} id='chatbox-div'>
    <ConfigProvider
        theme={{
          components: {
            Switch: {
              // handleBg: '#fff'
            },
          },
        }}
    >
      <Flex gap={'small'} style={{width: '95%', marginBottom: '0.2rem'}} className='center'>
        <div>
          <Tooltip title='How many chat histories included'>
            <Select style={{width: '7rem', height: '1.5rem'}}
                    value={includeChatHistory}
                    onChange={setIncludeChatHistory}
                    options={[{ value: 0, label: <span>No history</span>},
                      { value: 5, label: <span>Last 5</span>},
                      { value: 10, label: <span>Last 10</span>},
                      { value: 30, label: <span>Last 30</span>},
                      { value: 60, label: <span>Last 60</span>}
                    ]}/>
          </Tooltip>
        </div>
        <div>
          <Tooltip title={'Include Knowledge with RAG'}>
            <Switch checkedChildren="Knowledge" autoFocus={false} style={{marginBottom: '0.2rem'}}
                    checked={useRag} onChange={setUseRag}
                    unCheckedChildren="Knowlege"/>
            {useRag && <Tooltip title={'Top K Similarity Documents'}>
                <span style={{marginLeft:'0.2rem'}}>
                  Top
                  <Input size='small' value={ragTopK} onChange={(e)=>{setRagTopK(e.target.value)}}
                         style={{width:'2rem', height:'1.5rem', marginLeft:'0.2rem'}}/>
                </span>
            </Tooltip>}
          </Tooltip>
        </div>
        <div>
          Max Tokens
          <Input size='small' value={llmOption.max_completion_tokens} onChange={(e) => {
                    setLlmOption(p => {return {...p, max_completion_tokens: e.target.value}})
                  }}
                 style={{width: '3.5rem', height: '1.5rem', marginLeft: '0.2rem'}}/>
        </div>
      </Flex>
    </ConfigProvider>

    <div className="center"
         style={{border: '1px solid #ccc', width: '95%', borderRadius: '1rem', backgroundColor: 'white',}}>
      <UploadImage id={'chat-image-upload'} images={images} setImages={setImages} textDocs={textDocs} setTextDocs={setTextDocs}/>
      <Flex align="flex-end">
        <div style={{width: '2.6rem', borderRadius: '1rem',}}>
          <Tooltip title='Upload images/PDF'>
            <Button shape="circle" onClick={() => uploadImage('chat-image-upload')} type="text" icon={<PlusOutlined />} style={{marginLeft: '0rem', marginBottom: '0.25rem'}} />
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

    <ConfigProvider theme={{
      token: {
        colorPrimary: 'green'
      }
    }}>
      <FloatButton.Group
          trigger='hover'
          style={{marginBottom: '1rem'}}>
        <FloatButton type='default'
                     tooltip='Summary of usage'
                     onClick={() => setShowUsageDialog(true)}
                     icon={<PieChartOutlined />}/>
      </FloatButton.Group>

    </ConfigProvider>
  </div>)
}

export default ChatBox