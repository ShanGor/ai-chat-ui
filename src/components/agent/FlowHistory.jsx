import {useEffect, useState} from "react";
import "./FlowHistory.css"
import {formatDatetime} from "../../Utility.js";

export const FlowHistory = ({agentName, agentContext, setAgentContext, onChosen}) => {
    const [data, setData] = useState([])

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/flow-histories/${agentName}`).then(resp => {
            if (resp.ok) {
                resp.json().then(json => {
                    setData(json)
                })
            } else {
                console.error('Failed to fetch flow history: ', resp)
            }
        })
    }, [])


    return <ul>
        {data.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className={'flow-history'}>
                <a onClick={() => {onChosen(item.id?.submissionId)}}>{formatDatetime(new Date(item.creationTime))}</a>
            </li>
        ))}
    </ul>
};