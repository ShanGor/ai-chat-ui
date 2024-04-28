import {Select, Button, Tooltip, Flex, Typography } from "antd"
import {
    PlusOutlined,
    ArrowUpOutlined
  } from '@ant-design/icons';
import "./ChatBox.css"
import Microphone from "../assets/microphone.svg"

const ChatBox = () => {
    return (<div style={{marginTop: '1rem'}}>
      <Flex className="center" style={{border: '1px solid #ccc', width: '95%', borderRadius: '1rem'}}>
        <div style={{width: '2.6rem', backgroundColor: 'white', borderRadius: '1rem'}}>
          <Tooltip title='Upload files'>
            <Button shape="circle" type="text" icon={<PlusOutlined />} style={{marginTop: '1.65rem', marginLeft: '0rem'}} />
          </Tooltip>
        </div>
        <textarea style={{border: 0, resize:'none', outline: 'none', width: '100%', minHeight: '4rem', maxHeight: '10rem'}}></textarea>
        <Flex style={{width: '4.6rem', backgroundColor: 'white', borderRadius: '1rem'}}>
          <Tooltip title='Record voice'>
            <a style={{opacity: '0.6'}}>
              <img src={Microphone} alt="Microphone" style={{width: '1.5rem', marginTop: '2.05rem', marginLeft: '0.2rem'}} />
            </a>
          </Tooltip>
          <Tooltip title='Send message'>
            <Button shape="circle" type="text" style={{color: 'white',
               backgroundColor: 'black', marginTop: '1.65rem', marginRight: '0rem',
               borderBlockColor: 'black'}} icon={<ArrowUpOutlined />} />
          </Tooltip>
        </Flex>
      </Flex>
      
    </div>)
}

export default ChatBox