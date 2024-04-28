import { useState } from 'react'
import './App.css'
import LeftSider from './components/LeftSider'
import { theme, Card, Layout } from "antd";
import ChatBoard from './components/ChatBoard';
const { Sider, Content, Header, Footer } = Layout;

const mainPaneBgColor = null//'rgba(36, 36, 66, 0.8)'
const mainPaneBorderColor = '#e3e3e3'
const mainPaneHeaderColor = 'rgb(78 78 78)'
const mainPaneParagraphColor = '#374151'

const fetchEvents = (url, textConsumer, data=null, headers={}, method='POST') => {
  fetch(url, {
    method: method,
    headers: {...headers,
       'Content-Type': 'text/event-stream;chartset=UTF-8',
       'Connection': 'keep-alive',
       'Cache-Control': 'no-cache'
      },
    body: data
  })
  .then(response => {
    const reader = response.body.getReader()
    const textDecoder = new TextDecoder()
    const readChunk = () => {
      reader.read().then(({ value, done }) => {
        if (done) { 
          return
        }
        const text = textDecoder.decode(value)
        textConsumer(text.substring('event:'.length))
        readChunk()
      }).catch(error => {
        console.error(error)
      })
    }
  })
  readChunk()
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <>
      <Layout style={{width: '100vw', height: '100vh'}}>
        <Header>
          <div style={{color: 'white', marginTop: '-1rem', marginLeft: '-1rem'}}>
            <h2>AI Chat</h2>
          </div>
        </Header>
        <Content className='full-height'>
          <Layout theme='dark'  style={{height: '100%'}}>
            <Sider collapsible collapsed={collapsed}
                   width='20%'
                   collapsedWidth={15} className='full-height'
                   onCollapse={(collapsed) => {
              setCollapsed(collapsed)
            }}>
              <LeftSider collapsed={collapsed}/>
            </Sider>
            <Content style={{color: mainPaneBgColor, paddingLeft: '0.5rem', paddingTop: '0.5rem'}}>
              <ChatBoard/>
            </Content>
          </Layout>
        </Content>
      </Layout>
    </>
  )
}

export default App
