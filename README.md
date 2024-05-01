# AI Chat UI
Start from Ollama, to build a simple chat UI.

## Demo
![Demo](cat-story.gif)

## Features
- Chats in streaming manner
- Chat history by IndexedDB in browser
- Chat with both text and image (Image need to be supported by your LLM, like `Llava`)
### TODO
- To support regenerating of the last response. (Open WebUI supports it)
- To support options.
- To support the `clear` of the left side chat history. (Now it is only button)

## Tech stack:
- Ollama
- React.js with Ant Design
- Backend by Spring Boot Webflux (https://github.com/ShanGor/react-gateway/tree/feature/ai-chat-backend)