import {
  Checkbox,
  Select,
  Divider,
  Avatar,
  Flex, Popover,
  Tooltip,
  Image,
  Button,
} from "antd";
import { useState, useEffect, useContext } from "react";
import { ChatUiContext, mainPaneParagraphColor } from "../App";
import {
  CopyOutlined,
  EditOutlined,
  RedoOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import "./MarkdownCustom.css";
import ChatBox from "./ChatBox";
import user from "../assets/user.svg";
import assistant from "../assets/assistant.svg";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import dark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import NewChats from "./NewChats";
import GeneratingResponseSection from "./GeneratingResponseSection";
import {
  abbr,
  cancelGeneration,
  clearArray,
  fetchEvents,
  formatDate,
  trimImageMeta,
} from "../Utility";

let generatingTextCache = "";
let generatingBoxHeightCache = 0;

let ragData = []

const ChatBoard = ({ collapsed }) => {
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState("");
  const {currentChat, setCurrentChat, messageApi} = useContext(ChatUiContext);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatboxTop, setChatboxTop] = useState(0);
  const [selectModeBottom, setSelectModeBottom] = useState(0);
  const [contentPaneHeight, setContentPaneHeight] = useState("70vh");
  const [requestId, setRequestId] = useState("");
  const [chatboxWidth, setChatboxWidth] = useState("90%");
  const [useRag, setUseRag] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/tags`)
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models);
      });
    if (localStorage.getItem("model")) {
      setCurrentModel(localStorage.getItem("model"));
    }
  }, []);

  useEffect(() => {
    if (currentChat && currentChat.initiatedBySide) {
      setChatHistory(currentChat.chats || []);
    }
  }, [currentChat]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      let o;
      if (currentChat?.id) {
        o = { ...currentChat };
        o.initiatedBySide = undefined;
        o.chats = chatHistory;
      } else {
        o = {
          id: Date.now(),
          chats: chatHistory,
          name: abbr(chatHistory[0].content.message, 255),
        };
      }
      setCurrentChat(o);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatboxTop > 0 && selectModeBottom > 0) {
      setContentPaneHeight(`${chatboxTop - selectModeBottom + 20}px`);
    }
  }, [chatboxTop, selectModeBottom]);

  useEffect(() => {
    let mainPane = document.getElementById("chat-board-main");
    if (mainPane) {
      let totalWidth = mainPane.getBoundingClientRect().width;
      let targetWidth = `${Math.round(totalWidth * 0.9)}px`;
      setChatboxWidth(targetWidth);
      console.log("target width is", targetWidth);
    }
  }, [collapsed]);

  const modelChange = (value) => {
    localStorage.setItem("model", value);
    setCurrentModel(value);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      messageApi.open({
        type: "success",
        content: "Source code copied to clipboard!",
      });
    });
  };

  const isLastQuestion = (index) => {
    let lastIndex = chatHistory.length - 1;
    if (index == lastIndex) {
      if (chatHistory[index].role == "user") {
        return true;
      }
    } else if (index == lastIndex - 1) {
      if (
        chatHistory[lastIndex].role == "assistant" &&
        chatHistory[index].role == "user"
      ) {
        return true;
      }
    }
    return false;
  };

  const cancelRequest = () => {
    cancelGeneration();

    fetch(`${import.meta.env.VITE_API_URL}/api/cancel/${requestId}`)
      .then((resp) => {
        if (resp.status === 200) {
          console.log("Request cancelled");
        }
      })
      .then(() =>
        setTimeout(() => {
          setGenerating(false);
          setGeneratingText("");
        }, 100)
      );
  };

  const gotSomeMessage = () => {
    if (message && message?.trim().length > 0) {
      return true;
    }
    return false;
  };

  const setSizeChanged = () => {
    // console.log('size changed, pls check')
    setChatboxTop(
      document.getElementById("chat-box-parent").getBoundingClientRect().top
    );
  };

  const toggleRag = (e) => {
    setUseRag(e.target.checked);
  };

  const regenerateResult = () => {
    let idx = history.length - 1;
    let newHist = [];
    if (history[idx].role == "user") {
      // do something
      history.map((o) => newHist.push(o));
    } else {
      history.slice(0, idx).map((o) => newHist.push(o));
    }
  };

  const submitMessage = () => {
    if (!gotSomeMessage()) {
      messageApi.open({
        type: "error",
        content: "Please enter a message before sending",
      });
      return;
    }

    if (!currentModel) {
      messageApi.open({
        type: "error",
        content: "Please select a model before sending messages",
      });
    } else {
      setGenerating(true);
      if (useRag) {
        setChatHistory((hist) => {
          let newHist = [
            ...hist,
            {
              role: "user",
              content: {
                created_at: new Date().toLocaleString(),
                message: message?.trim(),
                model: currentModel,
              },
              images: images,
            },
          ];
          triggerAiChatCompletionWithRag(newHist);
          return newHist;
        });
        setMessage("");
        setImages([]);
      } else {
        setChatHistory((hist) => {
          let newHist = [
            ...hist,
            {
              role: "user",
              content: {
                created_at: new Date().toLocaleString(),
                message: message?.trim(),
                model: currentModel,
              },
              images: images,
            },
          ];
          responseHandler({});
          triggerAiChatCompletion(newHist);
          return newHist;
        });
        setMessage("");
        setImages([]);
      }
    }
  };

  const triggerAiChatCompletion = (hist) => {
    let request;
    if (hist.length > 0) {
      let requestMessages = [];
      hist.map((o) => {
        let msg = {
          role: o.role,
          content: o.content.message,
        };
        if (o.images) {
          msg.images = trimImageMeta(o.images);
        }
        requestMessages.push(msg);
      });
      request = {
        model: currentModel,
        messages: requestMessages,
        stream: true,
      };
    }

    fetchEvents(
      `${import.meta.env.VITE_API_URL}/chat/ollama`,
      (text) => {
        // console.log("got text", text)
        try {
          let o = JSON.parse(text);
          responseHandler(o);
        } catch (e) {
          console.log("error parsing", text);
          console.log("error details: ", e);
        }
      },
      JSON.stringify(request)
    );
  };

  const triggerAiChatCompletionWithRag = (hist) => {
    fetch(`${import.meta.env.VITE_API_URL}/api/find-embeddings/5`, {
      method: "POST",
      body: message?.trim(),
    })
      .then((res) => res.json())
      .then((data) => {
        messageApi.open({
          type: "success",
          content: "Get documents! Thinking and answering your question..",
        });
        // console.log("embeddings", data)
        if (data) {
          let rag_prompt = `As an AI assisnt, please answer questions by referencing below documents\n\nDocuments:\n`;
          for (let i = 0; i < data.length; i++) {
            let e = data[i];
            rag_prompt += `${e.raw_text}\n`;
            ragData.push(data[i])
          }
          // console.log("rag_prompt", rag_prompt)
          let messages = [
            {
              role: "system",
              content: {
                created_at: new Date().toLocaleString(),
                message: rag_prompt.trim(),
                model: currentModel,
              },
              images: images,
            },
            ...hist,
          ];
          responseHandler({});
          triggerAiChatCompletion(messages);
          setUseRag(false);
        } else {
          setChatHistory((hist) => {
            let newHist = [
              ...hist,
              {
                role: "assistant",
                content: {
                  created_at: new Date().toLocaleString(),
                  message:
                    "Sorry, I am not able to find the answer to your question",
                  model: currentModel,
                },
                images: [],
              },
            ];
            return newHist;
          });
        }
      });
    messageApi.open({
      type: "warning",
      content: "Searching relevant docs by embedding..",
    });
  };

  const formatReferenceDoc = (doc) => {
    let source = doc.meta_data.source;
    let title = doc.meta_data.title;
    let content = <div style={{width:'500px', maxHeight:'500px', overflowY: 'auto'}}>{doc.raw_text}</div>
    return <Popover content={content} placement='rightTop'>
      <a href={source}>{title||source}</a>
    </Popover>
  }

  const responseHandler = (data) => {
    // console.log("got data", data)
    setGenerating(true);

    if (data?.id) {
      setRequestId(data.id);
      generatingTextCache = "";
    }

    if (data?.message?.content) {
      generatingTextCache += data.message.content;
      setGeneratingText(generatingTextCache);

      // Move the view to the end of the chat history
      setTimeout(() => {
        let height =
          document
            .getElementById("generating-box-parent")
            ?.getBoundingClientRect()?.height || 0;
        if (height > generatingBoxHeightCache + 30) {
          generatingBoxHeightCache = height;
          // console.log('height', generatingBoxHeightCache)
          document
            .getElementById("generating-position")
            ?.scrollIntoView(true, { behavior: "smooth" });
        }
      }, 1000);
    }

    if (data?.done) {
      // console.log("done as: ", generatingTextCache)
      setChatHistory((old) => [
        ...old,
        {
          content: {
            message: generatingTextCache,
            model: data.model,
            ragData: [...ragData],
            created_at: data.created_at,
          },
          role: "assistant",
        },
      ]);
      setGenerating(false);
      generatingTextCache = "";
      clearArray(ragData)
      generatingBoxHeightCache = 0;
      setGeneratingText(generatingTextCache);
    }
  };

  return (
    <div className="center" id="chat-board-main">
      <div
        style={{
          top: "2.65rem",
          left: "16rem",
          position: "fixed",
          width: "80%",
        }}
        ref={(el) => {
          if (el) {
            setSelectModeBottom(el.getBoundingClientRect().bottom);
          }
        }}
      >
        <Divider orientation="center">
          <span style={{ marginRight: "0.5rem" }}>
            <Tooltip title="Create a new chat">
              <Button
                size="middle"
                style={{ color: "white", backgroundColor: "green" }}
                onClick={() => {
                  setCurrentChat({ initiatedBySide: true });
                }}
                icon={<PlusOutlined />}
              />
            </Tooltip>
          </span>
          <span style={{ marginRight: "0.5rem", fontSize: "1.3rem" }}>
            Select a model:
          </span>
          <Select
            style={{ width: "150px" }}
            value={currentModel}
            onSelect={modelChange}
            placeholder="from the list"
            options={models.map((model) => {
              return { value: model.name, label: model.name };
            })}
          />
          <span
            style={{
              marginLeft: "0.5rem",
              marginRight: "0.5rem",
              fontSize: "1.2rem",
            }}
          >
            Include Knowledge:
          </span>
          <Checkbox checked={useRag} onChange={toggleRag} />
        </Divider>
      </div>
      <div
        style={{
          marginTop: "3.5rem",
          height: contentPaneHeight,
          width: "100%",
          overflowY: "scroll",
          overflowX: "hidden",
        }}
      >
        {chatHistory.length > 0 ? (
          <div style={{ width: "99%" }}>
            {chatHistory.map((item, index) => {
              return (
                <div key={index}>
                  <Flex style={{ width: "98%" }}>
                    <div style={{ width: "10%", minWidth: "7rem" }}>
                      {item.role === "assistant" ? (
                        <>
                          <Avatar src={assistant} />
                          <div>{item.content.model}</div>
                        </>
                      ) : (
                        <Avatar src={user} />
                      )}
                    </div>
                    <div style={{ width: "90%", textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: mainPaneParagraphColor,
                          marginTop: "0rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {formatDate(item.content?.created_at)}
                      </div>
                      <div>
                        {item.images?.length > 0 && (
                          <Flex wrap="wrap" gap="small">
                            {item.images?.map((image, index) => {
                              return (
                                <div key={index}>
                                  <Image
                                    src={image}
                                    style={{
                                      maxWidth: "6rem",
                                      maxHeight: "6rem",
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </Flex>
                        )}
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          id={`message-${index}`}
                          children={item.content?.message}
                          components={{
                            code(props) {
                              const { children, className, node, ...rest } =
                                props;
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              return match ? (
                                <div style={{ position: "relative" }}>
                                  <SyntaxHighlighter
                                    {...rest}
                                    PreTag="div"
                                    children={String(children).replace(
                                      /\n$/,
                                      ""
                                    )}
                                    language={match[1]}
                                    style={dark}
                                  />
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "0.2rem",
                                      right: "0.2rem",
                                    }}
                                  >
                                    <Tooltip title={`Copy code: ${match[1]}`}>
                                      <a
                                        style={{ color: "white" }}
                                        onClick={() => copyCode(children)}
                                      >
                                        {<CopyOutlined />}
                                      </a>
                                    </Tooltip>
                                  </div>
                                </div>
                              ) : (
                                <code className={`${className} not-code`}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        />
                        {(item.role === 'assistant' && item.content?.ragData?.length > 0 ) && <div>
                            <h4>** Reference Documents</h4>
                            <ul>{item.content.ragData.map((refDoc, rIdx) => {
                                return <li key={rIdx}>{formatReferenceDoc(refDoc)}</li>
                            })}</ul>
                        </div>}
                      </div>
                      {isLastQuestion(index) ? (
                        <div style={{ position: "relative" }}>
                          <Flex
                            style={{
                              position: "absolute",
                              bottom: "-1.4rem",
                              left: "0px",
                            }}
                            gap="small"
                          >
                            <Tooltip title="Edit">
                              <Button
                                type="dashed"
                                size="small"
                                shape="circle"
                                icon={<EditOutlined />}
                              />
                            </Tooltip>
                            <Tooltip title="Regenerate">
                              <Button
                                type="dashed"
                                size="small"
                                shape="circle"
                                onClick={regenerateResult}
                                icon={<RedoOutlined />}
                              />
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
              );
            })}
            {generating && (
              <GeneratingResponseSection
                generatingText={generatingText}
                currentModel={currentModel}
              />
            )}
          </div>
        ) : (
          <NewChats setMessage={setMessage} />
        )}
      </div>

      <div
        style={{ position: "fixed", bottom: "0", width: "100%" }}
        id="chat-box-parent"
        ref={(el) => {
          if (el) {
            setChatboxTop(el.getBoundingClientRect().top);
          }
        }}
      >
        <ChatBox
          message={message}
          setMessage={setMessage}
          images={images}
          setImages={setImages}
          gotSomeMessage={gotSomeMessage}
          submitMessage={submitMessage}
          width={chatboxWidth}
          generating={generating}
          cancelRequest={cancelRequest}
          setChatHistory={setChatHistory}
          setSizeChanged={setSizeChanged}
        />
      </div>
    </div>
  );
};

export default ChatBoard;
