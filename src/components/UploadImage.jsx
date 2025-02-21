import {pdfjs} from "react-pdf";
import {getPageText} from "../PdfUtil.js";
import {Flex, Image, Modal, Radio, Spin} from "antd";
import {CloseOutlined} from "@ant-design/icons";
import {useState} from "react";
import "./UploadImage.css"

export const uploadImage = (id) => {
    document.getElementById(id).click()
}

export const UploadImage = ({id, images, setImages, setPdfText}) => {
    const [showPdfOption, setShowPdfOption] = useState(false)
    const [currentPdf, setCurrentPdf] = useState(null)
    const [pdfOption, setPdfOption] = useState(2)
    const [readingPdf, setReadingPdf] = useState(false)

    const removeImage = (index) => {
        setImages(images.filter((_, idx) => idx !== index))
        document.getElementById(id).value=null
    }

    const handleImageSelected = () => {
        if (!document.getElementById(id).files[0]) {
            return;
        }
        let selected = document.getElementById(id).files[0];
        let fileName = selected.name
        console.log("selected file name: ", fileName)
        let reader = new FileReader();
        if (fileName.endsWith('.pdf')) {
            // read pdf as text, or read as images
            reader.addEventListener("loadend", () => {
                let data = reader.result;
                setCurrentPdf(data)
                setShowPdfOption(true)
            });
            reader.readAsDataURL(selected);
        } else {
            reader.addEventListener("loadend", () => {
                let data = reader.result;
                setImages([...images, data]);
            });
            reader.readAsDataURL(selected);
        }
    }

    const readPdfAsImagesOrText = async() => {
        setReadingPdf(true)
        const canvas = document.getElementById('the-canvas');
        const context = canvas.getContext('2d');
        let pdf = await pdfjs.getDocument({url: currentPdf} ).promise
        for (let i = 1; i <= pdf.numPages; i++) {
            let page = await pdf.getPage(i)
            if (pdfOption === 1) {
                // read pdf as images
                const viewport = page.getViewport({scale: 1});
                canvas.height= viewport.height;
                canvas.width= viewport.width;
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;
                setImages(old=>{return [...old, canvas.toDataURL()]});
            } else if (pdfOption === 2) {
                // read pdf as text
                let text = await getPageText(page)
                setPdfText(text)
            }

        }
        setCurrentPdf(null)
        setShowPdfOption(false)
        setPdfOption(2)
        setReadingPdf(false)
    }

    const imageCard = (image, index) => {
        return (<div className="image-card" key={index}>
            <div style={{paddingTop: '0.5rem',}}>
                <Image src={image} alt="Image" style={{borderRadius: '0.5rem', width: '4rem', height: '4rem', objectFit: 'cover'}} />
            </div>

            <div className="close-image-container">
                <a onClick={() => {removeImage(index)}}><CloseOutlined className="close-image-icon"/></a>
            </div>
        </div>)
    }

    return (<>
        <input type="file" id={id}
               accept="application/pdf,image/xbm,image/jfif,image/gif,image/svg,image/jpeg,image/jpg,image/svgz,image/webp,image/png,image/bmp,image/pjp,image/apng,image/pjpeg,image/avif"
               onChange={handleImageSelected} style={{display: 'none'}}></input>
        <div style={{width: '100%', borderRadius: '1rem', display: `${images.length > 0 ? 'block' : 'none'}`}}>
            <Flex style={{marginBottom: '0.5rem', marginLeft: '0.5rem'}} gap='small' wrap="wrap">
                {images.map((image, index) => imageCard(image, index))}
            </Flex>
        </div>
        <Modal title="Upload PDF as images or text?"
               open={showPdfOption} onOk={readPdfAsImagesOrText}
               okButtonProps={{disabled: readingPdf}}
               onCancel={() => {setShowPdfOption(false)}} okText="Okay" cancelText="Cancel">
            <div style={{textAlign: 'center'}}>
                <Radio.Group onChange={(e) => {setPdfOption(e.target.value)}} value={pdfOption}>
                    <Radio value={1}>Images</Radio>
                    <Radio value={2}>Text</Radio>
                </Radio.Group>
            </div>
            <div style={{display: readingPdf?'block':'none', marginTop: '1rem'}} className='center'>
                <Spin size='large'/>
            </div>
        </Modal>
        <div style={{display: 'none'}}>
            <canvas id="the-canvas"></canvas>
        </div>
    </>)
}