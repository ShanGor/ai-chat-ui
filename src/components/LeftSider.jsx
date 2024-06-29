import {Divider, Tooltip, Button, Flex, ConfigProvider, Popconfirm} from "antd"
import {
  DeleteOutlined,
  EditOutlined,
  ClearOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useContext, useEffect, useState } from "react"
import './LeftSider.css'
import { ChatUiContext } from "../App";
import { abbr } from "../Utility";

const splitLineColor = 'rgba(250,250,250,0.5)'

let dbOpenStatus = 'waiting'
const dbConnection = window.indexedDB.open("chats",1);
let chatsDb
dbConnection.onsuccess = function (event) {
  chatsDb = dbConnection.result;
  dbOpenStatus = 'success'
  console.log('IndexedDB openned successfully!');
}
dbConnection.onerror = function (event) {
  dbOpenStatus = 'failed'
  console.error('Failed to open IndexedDB.');
}
dbConnection.onupgradeneeded = function(event) {
  chatsDb = event.target.result;
  if (!chatsDb.objectStoreNames.contains('chat')) {
    chatsDb.createObjectStore('chat', { keyPath: 'id' });
    console.log('Created object store for chat.');
  }
}

const LeftSider = ({collapsed=false}) => {
  const [data, setData] = useState([])
  const [chatDb, setChatDb] = useState(null)
  const [refreshTimes, setRefreshTimes] = useState(0)
  const {setCurrentChat, currentChat} = useContext(ChatUiContext)
  useEffect(() => {
    const checkDb = () => {
      if (dbOpenStatus === 'waiting') {
        setTimeout(checkDb, 100)
      } else if (dbOpenStatus === 'success') {
        setChatDb(chatsDb)
      }
    }

    checkDb()
  }, [])

  useEffect(() => {
    if (chatDb) {
      const objectStore = chatDb.transaction('chat').objectStore('chat');
      const request = objectStore.getAll();
      request.onsuccess = function(event) {
        const result = event.target.result;
        setData((result||[]).sort((a, b) => {
          return b.id - a.id;
        }))
      };
      request.onerror = function(event) {
        console.error('Failed to retrieve data from IndexedDB.');
      }
    }
  }, [chatDb, refreshTimes])

  useEffect(() => {
    if (chatDb && currentChat && !currentChat.initiatedBySide) {
      console.log("Data changed, now save it")
      let request = chatDb.transaction(['chat'], "readwrite").objectStore('chat').put(currentChat);
      request.onsuccess = function(event) {
        console.log('Data saved successfully.');
        setRefreshTimes(t => t+1)
      };
      request.onerror = function(event) {
        console.error('Failed to save data to IndexedDB.');
      }
    }
  }, [currentChat])

  const deleteHistory = (id) => {
    if (!chatDb) {
      console.error(`IndexedDB is not ready yet, cannot delete data with id ${id}.`);
      return
    }

    const objectStore = chatDb.transaction('chat', "readwrite").objectStore('chat');
    const request = objectStore.delete(id);
    request.onsuccess = function(event) {
      console.log('Data deleted successfully.');
      if (id == currentChat?.id) {
        setCurrentChat({initiatedBySide: true})
      }
      setRefreshTimes(t => t+1)
    };
    request.onerror = function(event) {
      console.error('Failed to delete data from IndexedDB.');
    }
  }

  const clearHistory = () => {
    if (!chatDb) {
      console.error(`IndexedDB is not ready yet, cannot clear data.`);
      return
    }
    const objectStore = chatDb.transaction('chat', "readwrite").objectStore('chat');
    const request = objectStore.clear();
    request.onsuccess = function(event) {
      console.log('Data cleared successfully.')
      setRefreshTimes(t => t+1)
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
                <Button size="small" style={{color:'white', backgroundColor:'green'}}
                        onClick={() => {setCurrentChat({initiatedBySide: true})}}
                        icon={<PlusOutlined />}/>
              </Tooltip>
            </span>
          </Divider>
        </ConfigProvider>
      <ul>
        {data?.map(item => <li className='chat-history' key={item.id}>
          <Flex>
            <div style={{width: '90%'}}>
              <Tooltip title={item.name}>
              {abbr(item.name, 25)}
              </Tooltip>
            </div>
            <Flex style={{width: '10%'}} justify='flex-end' align="flex-end">
              <Tooltip title='Edit/View'>
                <Button type="text" onClick={() => {setCurrentChat({ ...item, initiatedBySide: true,})}} style={{color:'white'}} shape="circle" size="small" icon={<EditOutlined />} />
              </Tooltip>
              <Tooltip title='Delete this item'>
                <Popconfirm title='Confirm to delete?'
                            onConfirm={()=>{deleteHistory(item.id)}}
                            onCancel={()=>{}}
                            okText="Yes"
                            cancelText="No"
                            description='Are you sure to delete this chat?'>
                  <Button type="text" style={{color:'white'}} shape="circle" size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </Flex>
          </Flex>
        </li>)}
        {data.length > 2 && <>
        <li className='chat-history' key='clear'>
          <div style={{marginTop: '0.5rem'}}>
          <Tooltip title='Clear all the history items'>
            <Popconfirm title='Confirm to clear?' onConfirm={clearHistory}>
              <Button type="text" style={{color:'white'}} size="small" icon={<ClearOutlined />}>Clear</Button>
            </Popconfirm>
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