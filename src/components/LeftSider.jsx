import {Divider, Tooltip, Button, Flex, ConfigProvider, Popconfirm, Spin} from "antd"
import {
  DeleteOutlined,
  EditOutlined,
  ClearOutlined,
  PlusOutlined, ImportOutlined, SaveOutlined,
} from '@ant-design/icons';
import { useContext, useEffect, useState } from "react"
import './LeftSider.css'
import { ChatUiContext } from "../App";
import {
  abbr,
  saveJson
} from "../Utility";
import IndexedDb from "../IndexedDb"

const splitLineColor = 'rgba(250,250,250,0.5)'

const LeftSider = (props) => {
  const {collapsed=false} = props
  const [data, setData] = useState([])
  const [chatsDb, setChatsDb] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [refreshTimes, setRefreshTimes] = useState(0)
  const {setCurrentChat, currentChat, messageApi} = useContext(ChatUiContext)

  useEffect(() => {
    new IndexedDb('chats', 1, 'chat').open().then(db => setChatsDb(db))
  }, [])

  useEffect(() => {
    if (chatsDb) {
      chatsDb.getAll((event) => {
        const result = event.target.result;
        setData((result||[]).sort((a, b) => {
          return b.id - a.id;
        }))
      }, (event) => {
        console.error('Failed to retrieve data from IndexedDB.');
      })
    }
  }, [chatsDb, refreshTimes])

  useEffect(() => {
    if (chatsDb && currentChat && !currentChat.initiatedBySide) {
      console.log("Data changed, now save it")
      chatsDb.saveObject(currentChat, (event) => {
        console.log('Data saved successfully.');
        setRefreshTimes(t => t+1)
      }, (event) => {
        console.error('Failed to save data to IndexedDB.');
      })
    }
  }, [currentChat])

  const importChats = () => {
    if (!chatsDb) {
      console.error(`IndexedDB is not ready yet, cannot import data.`);
      return
    }

    const fileInput = document.getElementById('import-chat-hist-button');
    const file = fileInput.files[0];

    if (!file) {
      console.error('No file selected.');
      return
    } else {
      console.log('File selected.', file);
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const fileContent = event.target.result
        fileContent?.split('\n').map(line => {
          if (line.trim() === '') return
          const chat = JSON.parse(line.trim());
          chatsDb.saveObject(chat, (event) => {
            console.log('imported one line');
          })
        })
        setRefreshTimes(t => t+1)
        messageApi.open({
          type: 'success',
          content: 'Chat imported successfully.',
        });
      } catch (e) {
        console.error('Failed to parse JSON file.', e);
      } finally {
        fileInput.value = '';
      }
    }
    reader.readAsText(file)
  }

  const deleteHistory = (id) => {
    if (!chatsDb) {
      console.error(`IndexedDB is not ready yet, cannot delete data with id ${id}.`);
      return
    }

    chatsDb.deleteItemByKey(id, (event) => {
      console.log('Data deleted successfully.')
      if (id === currentChat?.id) {
        setCurrentChat({initiatedBySide: true})
      }
      setRefreshTimes(t => t+1)
    }, (event) => {
      console.error('Failed to delete data from IndexedDB.')
    })

  }

  const exportChat = (id) => {
    setExporting(true)
    chatsDb.getItemByKey(id, (event) => {
      const result = event.target.result;
      saveJson(result, 'chats.json')
      setExporting(false)
    })

  }

  const exportChats = () => {
    setExporting(true)
    chatsDb.getAll((event) => {
      const result = event.target.result;
      saveJson(result, 'chats.json.txt')
      setExporting(false)
    })
  }

  const clearHistory = () => {
    if (!chatsDb) {
      console.error(`IndexedDB is not ready yet, cannot clear data.`);
      return
    }
    chatsDb.deleteAll((event) => {
      console.log('Data cleared successfully.')
      setRefreshTimes(t => t+1)
    })
  }

  return (
    <div className='full-height' style={{color: 'white', marginLeft: '0.5rem', marginRight: '0.5rem'}}>
      {collapsed ? null : <>
        <ConfigProvider theme={{token: {colorSplit: splitLineColor},}}>
          <Divider orientation="center" style={{color: 'white'}}>
            Chats
            <span style={{paddingLeft: '0.5rem'}}>
              <Tooltip title='Create a new chat'>
                <Button size="small" style={{color: 'white', backgroundColor: 'green'}}
                        onClick={() => {
                          setCurrentChat({initiatedBySide: true})
                        }}
                        icon={<PlusOutlined/>}/>
              </Tooltip>
            </span>
            <span style={{paddingLeft: '0.5rem'}}>
              <input id='import-chat-hist-button' type="file" hidden="true" onChange={importChats}/>
              {}
              <Tooltip title='Import Chats to Your History'>
                <Button size="small" icon={<ImportOutlined/>}
                        onClick={() => {
                          document.getElementById('import-chat-hist-button').click()
                        }}/>
              </Tooltip>
            </span>
            <span style={{paddingLeft: '0.5rem'}}>
              <Tooltip title='Export Your Chat History'>
                <Button size="small" icon={<SaveOutlined />}
                        disabled={exporting}
                        onClick={() => {
                          exportChats()
                        }}/>
              </Tooltip>
            </span>
            <span hidden={!exporting} style={{paddingLeft: '0.5rem'}}>
              <Spin />
            </span>

          </Divider>
        </ConfigProvider>
        <ul style={{paddingBottom: '60px', maxHeight: 'calc(100% - 50px)', overflow: 'auto'}}>
          {data?.map(item => <li className='chat-history' key={item.id}>
            <Flex>
              <div style={{width: '70%'}}>
                <Tooltip title={item.name}>
                  {abbr(item.name, 20)}
                </Tooltip>
              </div>
              <Flex style={{width: '30%'}} justify='flex-end' align="flex-end">
              <Tooltip title='Edit/View'>
                <Button type="text" onClick={() => {setCurrentChat({ ...item, initiatedBySide: true,})}} style={{color:'white'}} shape="circle" size="small" icon={<EditOutlined />} />
              </Tooltip>
                <Tooltip title='Export this chat'>
                  <Button type="text" onClick={() => { exportChat(item.id) }} style={{color:'white'}} shape="circle" size="small" icon={<SaveOutlined />} />
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