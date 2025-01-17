import {useEffect} from 'react';
import mermaid from 'mermaid';

const MermaidShow = ({chart}) => {
    useEffect(() => {
        mermaid.initialize({startOnLoad: true});
        mermaid.contentLoaded();
    }, []);
    return (<div className="mermaid"> {chart} </div>);
};
export default MermaidShow;