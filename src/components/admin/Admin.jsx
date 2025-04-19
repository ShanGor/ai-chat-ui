import {Button, Checkbox, Flex, Layout, message, Modal, Select, Slider, Tooltip} from "antd";
import {ChatUiContext, mainPaneBgColor} from "../../App.jsx";
import LeftSiderAdmin from "./LeftSiderAdmin.jsx";
import {useParams} from "react-router";
import ManageDocs from "./ManageDocs.jsx";
import AdminSettings from "./AdminSettings.jsx";
import Agents from "./Agents.jsx";

const {Sider, Content, Header, Footer} = Layout;
const Admin = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const params = useParams()

    const currentPath = () => {
        switch (params.adminPath) {
            case 'docs':
                return <ManageDocs />
            case 'agents':
                return <Agents />
            case 'settings':
                return <AdminSettings />
            default:
                return <ManageDocs />
        }
    }

    return (
        <ChatUiContext.Provider value={{messageApi}}>
            {contextHolder}
            <Layout theme='dark' style={{width: '100vw', minHeight: '100vh'}}>
                <Header style={{
                    height: '3rem', width: '100vw',
                    position: 'fixed',
                }}>
                    <Flex style={{color: 'white'}}>
                        <div style={{width: '15rem'}}>
                            <div style={{marginTop: '-1rem', marginLeft: '-1rem'}}>
                                <h2>AI Chat Admin</h2>
                            </div>
                        </div>
                        <Flex justify={"space-between"} style={{width: '100%', marginTop:'-0.6rem'}}>
                            <div></div>
                            <div>
                            </div>
                            <div style={{marginTop: '0.4rem'}}>
                                Who am I
                            </div>
                        </Flex>
                    </Flex>
                </Header>
                <Content theme='dark' className='full-height'>
                    <Layout hasSider theme='dark' style={{height: '100%'}}>
                        <Sider width='15rem'
                               style={{
                                   overflow: 'auto',
                                   height: '100vh',
                                   position: 'fixed',
                                   left: 0,
                                   top: '3rem',
                                   bottom: 0,
                               }}
                               className='full-height'>
                            <LeftSiderAdmin />
                        </Sider>
                        <Content style={{
                            color: mainPaneBgColor,
                            marginTop: '2rem',
                            marginLeft: '15rem',
                            paddingLeft: '0.5rem',
                            paddingTop: '0.5rem'
                        }}>
                            <div style={{paddingTop: '0.5rem'}}>
                                {currentPath()}
                            </div>
                        </Content>
                    </Layout>
                </Content>
            </Layout>


        </ChatUiContext.Provider>
    )
}

export default Admin
