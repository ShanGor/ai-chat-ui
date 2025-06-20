import "./MarkdownCustom.css"
import remarkGfm from "remark-gfm";
import dark from "react-syntax-highlighter/dist/cjs/styles/prism/one-dark.js";
import Markdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {Collapse, Tabs, Tooltip} from "antd";
import {CopyOutlined} from "@ant-design/icons";
import {lazy, memo, Suspense, useContext} from "react";
import Loading from "../Loading.jsx";
import PlantUMLShow from "./PlantUMLShow.jsx";
import {ChatUiContext} from "../App";
import MarkdownCsvShow from "./MarkdownCsvShow.jsx";

const MermaidShow = lazy(()=> import("./MermaidShow.jsx"));
const RevealjsShow = lazy(()=> import("./RevealjsShow.jsx"));
const PptxGenJsShow = lazy(()=> import("./PptxGenJsShow.jsx"));

const MarkdownCustom = memo(({markdownScript, index=0}) => {
    const {messageApi} = useContext(ChatUiContext)
    const copyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            messageApi.open({
                type: 'success',
                content: 'Source code copied to clipboard!',

            })
        })
    }


    const syntaxHighlight = (rest, childrenObj, match, style, className) => {
        let child = String(childrenObj).replace(/\n$/, '')
        let source = <div><SyntaxHighlighter {...rest} PreTag="div"
                                             children={child}
                                             language={match[1]} style={style}>
        </SyntaxHighlighter>
            <div style={{position: 'absolute', top: '0.2rem', right: '0.2rem'}}>
                <Tooltip title={`Copy code: ${match[1]}`}>
                    <a style={{color: 'white'}} onClick={() => copyCode(childrenObj)}>{<CopyOutlined />}</a>
                </Tooltip>
            </div>
        </div>
        if ("language-mermaid" === className) {
            let items = [{
                key: '1',
                label: 'Mermaid',
                children: <Suspense fallback={<Loading />}>
                    <MermaidShow chart={child} />
                </Suspense>,
            }, {
                key: '2',
                label: 'Source',
                children: source,
            },]
            return <Tabs defaultActiveKey="1" items={items}></Tabs>
        } else if (("language-javascript" === className || className === "language-js" || className === "language-jsx") && child.includes("PptxGenJS")) {
            let items = [{
                key: '1',
                label: 'Script Source',
                children: source,
            },{
                key: '2',
                label: 'PptxGenJS',
                children: <Suspense fallback={<Loading />}>
                    <PptxGenJsShow scriptForSlides={child} />
                </Suspense>,
            }, ]
            return <Tabs defaultActiveKey="1" items={items}></Tabs>
        } else if (("language-html" === className || className.toLowerCase().includes("revealjs")) && (child.includes("<section>") || child.includes("<nav>"))) {
            let items = [{
                key: '1',
                label: 'RevealJs (Click the slide and press F for FullScreen)',
                children: <Suspense fallback={<Loading />}>
                    <RevealjsShow slides={child} />
                </Suspense>,
            }, {
                key: '2',
                label: 'Source',
                children: source,
            },]
            return <Tabs defaultActiveKey="1" items={items}></Tabs>
        } else if ("language-csv" === className) {
            let items = [{
                key: '1',
                label: 'CSV',
                children: <MarkdownCsvShow csv={child} />,
            }, {
                key: '2',
                label: 'Source',
                children: source,
            },]
            return <Tabs defaultActiveKey="1" items={items}></Tabs>
        } else if ("language-plantuml" === className) {
            let items = [{
                key: '1',
                label: 'PlantUML',
                children: <PlantUMLShow chart={child} />,
            }, {
                key: '2',
                label: 'Source',
                children: source,
            },]
            return <Tabs defaultActiveKey="1" items={items}></Tabs>
        } else {
            return source
        }
    }

    const formatThinkingText = (markdownScript) => {
        if (!markdownScript) return <></>;

        if (markdownScript.trim().startsWith("<think>")) {
            if (markdownScript.includes("</think>")) {
                const thinkingText = markdownScript.split('<think>')[1].split('</think>')[0]
                const restScript = markdownScript.split('</think>')[1]
                return <>
                    <Collapse items={[{
                        key: '1',
                        label: 'Chain of Thinking',
                        children: <Markdown remarkPlugins={[remarkGfm]}>{thinkingText}</Markdown>,
                    }]} />
                    <Markdown remarkPlugins={[remarkGfm]} id={`message-${index}`}
                              children={restScript}
                              components={{
                                  code(props) {
                                      const {children, className, node, ...rest} = props
                                      const match = /language-(\w+)/.exec(className || '')
                                      return match ? (
                                          <div style={{position: 'relative'}}>
                                              {syntaxHighlight(rest, children, match, dark, className)}
                                          </div>
                                      ) : (
                                          <code className={`${className} not-code`}>
                                              {children}
                                          </code>
                                      )
                                  }
                              }}
                    />
                </>
            } else { // not yet completed!
                const thinkingText = markdownScript.split('<think>')[1]
                return <>
                    <Collapse items={[{
                        key: '1',
                        label: 'Thinking Result',
                        children: <Markdown remarkPlugins={[remarkGfm]}>{thinkingText}</Markdown>,
                    }]} defaultActiveKey={['1']} />
                </>
            }
        } else {
            return <Markdown remarkPlugins={[remarkGfm]} id={`message-${index}`}
                             children={markdownScript}
                             components={{
                                 code(props) {
                                     const {children, className, node, ...rest} = props
                                     const match = /language-(\w+)/.exec(className || '')
                                     return match ? (
                                         <div style={{position: 'relative'}}>
                                             {syntaxHighlight(rest, children, match, dark, className)}
                                         </div>
                                     ) : (
                                         <code className={`${className} not-code`}>
                                             {children}
                                         </code>
                                     )
                                 }
                             }}
            />
        }
    }

    return formatThinkingText(markdownScript);
});
export default MarkdownCustom;