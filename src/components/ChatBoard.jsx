import {Select, Tooltip, Button, Flex, ConfigProvider} from "antd"
import { useState, useEffect } from "react"

const ChatBoard = () => {
    const [models, setModels] = useState([])
    const [currentModel, setCurrentModel] = useState(null)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/tags`).then(res => res.json()).then(data => {
            setModels(data.models)
        })
    }, [])

    return (<>
    <Select style={{width: '150px'}}
            value={currentModel} onSelect={setCurrentModel}
            placeholder="Select a model"
            options={models.map(model => {
                return {value: model.name, label: model.name}
            })} />
    </>
    )
}

export default ChatBoard