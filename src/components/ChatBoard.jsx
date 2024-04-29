import {Select, Divider, Tooltip, Flex, Typography } from "antd"
import { useState, useEffect } from "react"
import { mainPaneParagraphColor } from "../App"
import {
    AndroidOutlined,
  } from '@ant-design/icons';
import QuickTask from "./QuickTask";
import ChatBox from "./ChatBox";

const { Title } = Typography;


const ChatBoard = () => {
    const [models, setModels] = useState([])
    const [currentModel, setCurrentModel] = useState(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/tags`).then(res => res.json()).then(data => {
            setModels(data.models)
        })
    }, [])

    const onQuickTask = (task) => {
        setMessage(task + "\n")
    }

    return (<div className="center">
        <Divider orientation='center'>
            <span style={{marginRight: '0.5rem', fontSize: '1.3rem'}}>Select a model:</span>
          <Select style={{width: '150px'}}
            value={currentModel} onSelect={setCurrentModel}
            placeholder="from the list"
            options={models.map(model => {
                return {value: model.name, label: model.name}
            })} />
        </Divider>
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
        <ChatBox message={message} model={currentModel} setMessage={setMessage}/>
    </div>
    )
}

export default ChatBoard