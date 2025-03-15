import {memo} from "react";
import {Button} from "antd";
import PptxGenJS from 'pptxgenjs';

const PptxGenJsShow = memo(({scriptForSlides}) => {
    if (!scriptForSlides) return <></>
    console.log("PptxGenJS name: ", PptxGenJS.name)
    const executeScript = async () => {
        return new Promise((resolve, reject) => {
            try {
                eval(scriptForSlides);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    return (<div>
        <Button type={'primary'} onClick={executeScript}>Click to generate the PPTX</Button>
    </div>);
})

export default PptxGenJsShow;