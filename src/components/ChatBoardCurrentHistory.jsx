import {Avatar, Button, Divider, Flex, Image, Input, Modal, Popconfirm, Popover, Tooltip} from "antd";
import assistant from "../assets/assistant.svg";
import user from "../assets/user.svg";
import {mainPaneParagraphColor} from "../App.jsx";
import {formatDate} from "../Utility.js";
import MarkdownCustom from "./MarkdownCustom.jsx";
import {EditOutlined, RedoOutlined} from "@ant-design/icons";
import GeneratingResponseSection from "./GeneratingResponseSection.jsx";
import NewChats from "./NewChats.jsx";
import {useState} from "react";
import {TextDocCard} from "./TextDocCard.jsx";

const ChatBoardCurrentHistory = ({chatHistory, setChatHistory, generating, generatingText, currentModel, setMessage, regenerateResult, currentRole}) => {
    // edit last question message
    const [editQuestionModalOpen, setEditQuestionModalOpen] = useState(false)
    const [editMessage, setEditMessage] = useState("")
    const [editMessageIndex, setEditMessageIndex] = useState(-1)

    const deleteItemInChat = (idx) => {
        if (idx < chatHistory.length) {
            setChatHistory(old => {
                let newHist = [...old]
                newHist.splice(idx, 1)
                return newHist
            })
        }
    }

    const isLastQuestion = (index) => {
        let lastIndex = chatHistory.length - 1
        if (index === lastIndex) {
            if (chatHistory[index].role==='user') {
                return true
            }
        } else if (index === lastIndex - 1) {
            if (chatHistory[lastIndex].role==='assistant' && chatHistory[index].role==='user') {
                return true
            }
        }
        return false
    }

    const editLastQuestion = (idx) => {
        setEditMessage(chatHistory[idx].content.message)
        setEditQuestionModalOpen(true)
        setEditMessageIndex(idx)
    }

    const formatReferenceDoc = (doc) => {
        if (!doc) return <></>
        let meta = null;
        if (doc.metadata) {
            meta = doc.metadata
        } else if (doc.metaData) {
            meta = doc.metaData
        }
        let source = meta?.source || meta?.fileOriginalName || 'Unknown'
        let pageId = meta?.id_in_source || meta?.fileRecordId || 'Unknown'
        let title = meta?.title || pageId
        let url = ''
        let content = <div style={{width: '500px', maxHeight: '500px', overflowY: 'auto'}}>{doc.text}</div>
        return <Popover content={content} placement="rightTop">
            {source}: <a href={url} target='_blank'>{title}</a>
        </Popover>
    }

    const handleEditLastQuestionOk = () => {
        let newHist = [...chatHistory]
        newHist[editMessageIndex].content.message = editMessage
        setChatHistory(newHist)
        setEditQuestionModalOpen(false)
    }

    return <>
            {chatHistory.length > 0 ? <div style={{width: '99%'}}>{
                    chatHistory.map((item, index) => {
                        return <div key={index}>
                            <Flex style={{width: '98%'}}>
                                <div style={{width: '10%', minWidth: '7rem'}}>{
                                    item.role === 'assistant' ?
                                        <>
                                            <Avatar src={assistant}/>
                                            <div>{item.content.model}</div>
                                        </> :
                                        <Avatar src={user}/>
                                }</div>
                                <div style={{width: '90%', textAlign: 'left'}}>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: mainPaneParagraphColor,
                                        marginTop: '0rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <span>{formatDate(item.content?.created_at)}</span>
                                        <span style={{marginLeft: '0.5rem'}}>
                            <Tooltip title='Delete current row'>
                              <Popconfirm title='Confirm to delete?' onConfirm={() => deleteItemInChat(index)}>
                                <Button size={'small'} type={'text'} variant="text">Delete</Button>
                              </Popconfirm>
                            </Tooltip>

                          </span>
                                    </div>
                                    <div>
                                        {item.images?.length + item.textDocs?.length > 0 && <Flex wrap="wrap" gap='small'>
                                            {item.images?.map((image, index) => {
                                                return <div key={index}>
                                                    <Image src={image} style={{maxWidth: '6rem', maxHeight: '6rem'}}/>
                                                </div>
                                            })}
                                            {item.textDocs?.map((textDoc, index) => <TextDocCard
                                                key={'text-card-display' + index}
                                                textDoc={textDoc}
                                                index={index} setTextDocs={null}></TextDocCard>)}
                                        </Flex>}
                                        <MarkdownCustom index={index} markdownScript={item.content?.message}/>
                                        {(item.role === 'assistant' && index >= 1 && chatHistory[index - 1].referenceData && chatHistory[index - 1].referenceData.length > 0) &&
                                            <div>
                                                <h4>**Reference Documents**</h4>
                                                <ul>
                                                    {chatHistory[index - 1].referenceData.map((refDoc, rIdx) => {
                                                        return <li key={rIdx}>{formatReferenceDoc(refDoc)}</li>
                                                    })}
                                                </ul>
                                            </div>}
                                    </div>
                                    {isLastQuestion(index) ? (
                                        <div style={{position: "relative"}}>
                                            <Flex
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-1.4rem",
                                                    left: "0px",
                                                }}
                                                gap="small"
                                            >
                                                <Tooltip title="Edit">
                                                    <Button type="dashed" size="small" shape="circle" onClick={() => {
                                                        editLastQuestion(index)
                                                    }} icon={<EditOutlined/>}/>
                                                </Tooltip>
                                                <Tooltip title="Regenerate">
                                                    <Button type="dashed" size="small" shape="circle" onClick={() => {
                                                        regenerateResult(index)
                                                    }} icon={<RedoOutlined/>}/>
                                                </Tooltip>
                                            </Flex>
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            </Flex>
                            <Divider></Divider>
                        </div>
                    })}
                    {generating && <GeneratingResponseSection generatingText={generatingText} currentModel={currentModel}/>}
                </div> :
                <NewChats setMessage={setMessage} currentRole={currentRole} />}

        <Modal title="Edit Question" open={editQuestionModalOpen} onOk={handleEditLastQuestionOk} onCancel={() => {setEditQuestionModalOpen(false)}} okText="Save" cancelText="Cancel">
            <Input.TextArea rows={4} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} />
        </Modal>
    </>

};

export default ChatBoardCurrentHistory;