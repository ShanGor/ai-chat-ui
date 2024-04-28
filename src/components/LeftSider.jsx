import {Divider, Tooltip, Button, Flex, ConfigProvider} from "antd"
import {
  DeleteOutlined,
  EditOutlined,
  ClearOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useState } from "react"
import './LeftSider.css'

const splitLineColor = 'rgba(250,250,250,0.5)'
const LeftSider = ({collapsed=false}) => {
  const [data, setData] = useState([
    'Racing car sprays burning fuel into crowd.',
    'Japanese princess to wed commoner.',
    'Australian walks 100km after outback crash.',
    'Man charged over missing wedding girl.',
    'Los Angeles battles huge wildfires.',
  ])

  const abbr = (str) => {
    const max = 28
    if (str && str.length > max) {
      return `${str.substring(0, max)}..`
    } else {
      return str
    }
  }

  return (
    <div className='full-height' style={{color: 'white', marginLeft: '0.5rem', marginRight: '0.5rem'}}>
      {collapsed ? null : <>
        <ConfigProvider theme={{token: {colorSplit: splitLineColor},}}>
          <Divider orientation="center" style={{color: 'white'}}>
            Chats
            <span style={{paddingLeft:'0.5rem'}}>
              <Tooltip title='Create a new chat'>
                <Button size="small" style={{color:'white', backgroundColor:'green'}} icon={<PlusOutlined />}/>
              </Tooltip>
            </span>
          </Divider>
        </ConfigProvider>
      <ul>
        {data.map(item => <li className='chat-history' key={item}>
          <Flex>
            <div style={{width: '90%'}}>
              <Tooltip title={item}>
              {abbr(item)}
              </Tooltip>
            </div>
            <Flex style={{width: '10%'}} justify='flex-end' align="flex-end">
              <Tooltip title='Edit/View'>
                <Button type="text" style={{color:'white'}} shape="circle" size="small" icon={<EditOutlined />} />
              </Tooltip>
              <Tooltip title='Delete this item'>
                <Button type="text" style={{color:'white'}} shape="circle" size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Flex>
          </Flex>
        </li>)}
        {data.length > 2 && <>
        <li className='chat-history' key='clear'>
          <div style={{marginTop: '0.5rem'}}>
          <Tooltip title='Clear all the history items'>
            <Button type="text" style={{color:'white'}} size="small" icon={<ClearOutlined />}>Clear</Button>
          </Tooltip>
          </div>
        </li>
        </>}
      </ul>
      </>}
      
    </div>
  )

}

export default LeftSider