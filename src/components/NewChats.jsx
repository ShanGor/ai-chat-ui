import {ChatUiContext, mainPaneParagraphColor} from "../App"

import QuickTask from "./QuickTask";
import {Flex, Typography} from "antd"
import {
    AndroidOutlined,
} from '@ant-design/icons';
import {useContext} from "react";

const { Title } = Typography;

const NewChats = ({setMessage, currentRole }) => {

    const {setCurrentAgent} = useContext(ChatUiContext)

    const onQuickTask = ({message, agentName}) => {
        if (agentName) {
            setCurrentAgent(agentName)
            setMessage("")
        } else {
            setCurrentAgent(null)
            setMessage(message)
        }
    }

    const QuickChatTemplates = () => {
        if (currentRole === 'Presenter') {
            return (
                <Flex justify="center" style={{width: '800px'}} className="center" gap='large' wrap="wrap">
                    <QuickTask onClick={onQuickTask} title='Design with RevealJs' description='for requirements: ' />
                    <QuickTask onClick={onQuickTask} title='Design with PptxGenJs' description="for requirements: " />
                </Flex>
            )
        } else if (currentRole === 'BA') {
            return (
                <Flex justify="center" style={{width: '800px'}} className="center" gap='large' wrap="wrap">
                    <QuickTask onClick={onQuickTask} agentName={'test-agent'} title='BA Flow' description='For user story writting' />
                    <QuickTask onClick={onQuickTask} title='Design with RevealJs' description='for requirements: ' />
                </Flex>
            )
        } else {
            return (
                <Flex justify="center" style={{width: '800px'}} className="center" gap='large' wrap="wrap">
                    <QuickTask onClick={onQuickTask} title='Tell me a joke' description='about the Roman Empire' />
                    <QuickTask onClick={onQuickTask} title='Show me a code snippet' description="of a website's sticky header" />
                    <QuickTask onClick={onQuickTask} title='Help me study' description='vacabulary for a college entrance exam' />
                    <QuickTask onClick={onQuickTask} title='Give me ideas' description="for what to do with my kids's art" />
                </Flex>
            )
        }
    }

    return (
        <div>
              <div style={{width: '100%'}}>
                  <div className="center" 
                       style={{borderRadius: '50%', width: '3rem', height: '3rem', border: '1px solid #ccc', background: 'white', marginTop: '2rem', marginBottom: '-1.5rem'}}>
                    <AndroidOutlined style={{fontSize: '1.5rem', marginTop: '0.7rem'}} />
                  </div>
                  <Title level={3} style={{color: mainPaneParagraphColor}}>Hi pretty!<br/>
                  How can I help you today!</Title>
              </div>
              <QuickChatTemplates />
        </div>
    )
}

export default NewChats;