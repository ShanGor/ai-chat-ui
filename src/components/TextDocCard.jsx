import {Image} from "antd";
import {CloseOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";
import './UploadImage.css'

export const TextDocCard = ({textDoc, index, setTextDocs}) => {
    const [imgDataUrl, setImgDataUrl] = useState('');

    useEffect(() => {
        const canvas = document.getElementById('the-canvas-for-text-card');
        const context = canvas.getContext('2d');
        // 清空画布
        context.clearRect(0, 0, canvas.width, canvas.height);
        // set background to be white
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        // 设置字体样式
        context.font = '20px Arial';
        // 设置最大宽度和行高
        const maxWidth = 1000; // 根据需要调整
        const lineHeight = 24; // 根据需要调整
        const maxHeight = 1000;
        // 调用wrapText函数绘制带换行的文本
        wrapText(context, textDoc, 12, 12, maxWidth, lineHeight, maxHeight);

        const imgDataUrl = canvas.toDataURL('image/png');
        setImgDataUrl(imgDataUrl);
    }, []);

    function wrapText(context, text, x, y, maxWidth, lineHeight, maxHeight) {
        // 按换行符分割文本
        const lines = text.split('\n');
        let currentY = y;
        for (let i = 0; i < lines.length; i++) {
            let index = i;
            let line = lines[i];
            let words = line.split(' ');
            let currentLine = '';
            currentY +=  lineHeight;
            if (currentY > maxHeight) return;

            for (let j = 0; j < words.length; j++) {
                let word = words[j];
                let testLine = currentLine + word + ' ';
                let metrics = context.measureText(testLine);
                let testWidth = metrics.width;

                if (testWidth > maxWidth && currentLine !== '') {
                    context.fillText(currentLine, x, currentY);
                    currentLine = word + ' ';
                    currentY += lineHeight;
                    if (currentY > maxHeight) return;
                } else {
                    currentLine = testLine;
                }
            }

            // 绘制最后一行
            if (currentLine !== '') {
                context.fillText(currentLine, x, currentY);
            }
        }
    }

    return (<div className="image-card">
        <div style={{display: 'none'}}>
            <canvas id="the-canvas-for-text-card" width={1024} height={1024}></canvas>
        </div>
        <div style={{paddingTop: '0.5rem'}}>
            {imgDataUrl !== '' &&
                <Image src={imgDataUrl} alt="Image"
                       style={{borderRadius: '0.5rem', width: '4rem', height: '4rem', objectFit: 'cover'}}/>}

        </div>

        {setTextDocs && <div className="close-image-container">
            <a onClick={() => {
                setTextDocs(list => list.filter((_, idx) => idx !== index))
            }}><CloseOutlined className="close-image-icon"/></a>
        </div>}

    </div>)
}
