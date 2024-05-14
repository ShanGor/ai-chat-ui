import { createContext, useState } from 'react'
import './App.css'
import LeftSider from './components/LeftSider'
import { theme, message, Layout } from "antd";
import ChatBoard from './components/ChatBoard';
const { Sider, Content, Header, Footer } = Layout;

export const mainPaneBgColor = null//'rgba(36, 36, 66, 0.8)'
export const mainPaneBorderColor = '#e3e3e3'
export const mainPaneHeaderColor = 'rgb(78 78 78)'
export const mainPaneParagraphColor = '#374151'

export const ChatUiContext = createContext(null)

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(false)
  const [currentChat, setCurrentChat] = useState(null)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <ChatUiContext.Provider value={{messageApi, currentChat, setCurrentChat}}>
      {contextHolder}
      <Layout theme='dark' style={{width: '100vw', minHeight: '100vh'}}>
        <Header style={{height: '3rem',width: '100vw',
                    position: 'fixed',}}>
          <div style={{color: 'white', marginTop: '-1rem', marginLeft: '-1rem'}}>
            <h2>AI Chat</h2>
          </div>
        </Header>
        <Content theme='dark' className='full-height'>
          <Layout hasSider theme='dark'  style={{height: '100%'}}>
            <Sider collapsible collapsed={collapsed}
                   width='15rem'
                   style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: '3rem',
                    bottom: 0,
                  }}
                   collapsedWidth={15} className='full-height'
                   onCollapse={(collapsed) => {
              setCollapsed(collapsed)
            }}>
              <LeftSider collapsed={collapsed} />
            </Sider>
            <Content style={{color: mainPaneBgColor,
              marginTop: '2rem', marginLeft: `${collapsed? '0.5rem' : '15rem'}`, paddingLeft: '0.5rem', paddingTop: '0.5rem'}}>
              <ChatBoard collapsed={collapsed}/>
            </Content>
          </Layout>
        </Content>
      </Layout>
    </ChatUiContext.Provider>
  )
}

export default App
