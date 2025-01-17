import {Avatar, Flex, Spin} from "antd"
import { mainPaneParagraphColor } from "../App"
import {
    ReloadOutlined,
} from '@ant-design/icons';
import "./MarkdownCustom.css"
import assistant from '../assets/assistant.svg'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate } from "../Utility";

// eslint-disable-next-line react/prop-types
const GeneratingResponseSection = ({generatingText, currentModel}) => {

    return (<div>
        <Flex style={{width: '98%', position: 'relative', minHeight: '5rem'}}>
            <div style={{width:'10%', minWidth: '7rem'}}>
                <Avatar src={assistant} />
                <div>{currentModel}</div>
            </div>
            <div style={{width:'90%', textAlign:'left'}}>
                <div style={{fontSize: '0.7rem', color: mainPaneParagraphColor, marginTop: '0rem', marginBottom: '0.5rem'}}>
                    {formatDate(new Date().toLocaleString())}
                    <Spin size='small' style={{marginLeft: '0.5rem'}}/>
                </div>
                <div id='generating-box-parent'>
                    <Markdown remarkPlugins={[remarkGfm]}>{generatingText}</Markdown>
                    <Spin style={{marginLeft: '0.5rem'}}
                          indicator={
                              <ReloadOutlined
                                  style={{
                                      fontSize: 12,
                                  }}
                                  spin
                              />
                          }
                    />
                    <span id='generating-position'></span>
                </div>
            </div>
        </Flex>
    </div>)
}

export default GeneratingResponseSection;