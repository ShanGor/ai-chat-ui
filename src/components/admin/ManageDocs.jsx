import {useContext, useEffect, useState} from "react";
import {Button, Flex, Popconfirm, Progress, Spin, Switch, Table, Tooltip} from "antd";
import {CloudUploadOutlined, DeleteOutlined} from "@ant-design/icons";
import md5 from 'js-md5';
import {ChatUiContext} from "../../App.jsx";
import {base64} from "../../Utility.js";

const blockSize = 8 * 1024;

const ManageDocs = () => {
    const {messageApi} = useContext(ChatUiContext)
    const [docs, setDocs] = useState([]);
    const [ocr, setOcr] = useState(false)
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [spinning, setSpinning] = useState(false)
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });

    const toURLSearchParams = (tableParams) => {
        return `page=${tableParams.pagination.current - 1}&pageSize=${tableParams.pagination.pageSize}`
    };

    const fetchData = async () => {
        setLoading(true)
        const params = toURLSearchParams(tableParams);

        let res = await fetch(`${import.meta.env.VITE_API_URL}/api/docs?${params}`, {
            mode: 'cors'
        })
        if (!res.ok) {
            messageApi.open({
                type: 'error',
                content: `Failed to fetch the docs: ${await res.text()}`,
            })
            setLoading(false)
            return
        }

        let data = await res.json()
        setDocs(data?.content)
        setLoading(false)
        setTableParams({
            ...tableParams,
            pagination: {
                ...tableParams.pagination,
                current: data.number + 1,
                total: data.totalElements || 0,
            },
        });
    }

    useEffect(() => {
        fetchData().then()
    }, [
        tableParams.pagination?.current,
        tableParams.pagination?.pageSize,
        tableParams?.sortOrder,
        tableParams?.sortField,
        JSON.stringify(tableParams.filters),
    ]);

    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
            sortField: Array.isArray(sorter) ? undefined : sorter.field,
        });

        // `dataSource` is useless since `pageSize` changed
        if (pagination.pageSize !== tableParams.pagination?.pageSize) {
            setDocs([]);
        }
    };


    const convertRag = async (id) => {
        setSpinning(true)
        let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/convert/${id}`, {
            method: 'POST',
            mode: 'cors',
        })
        if (resp.ok) {
            messageApi.open({
                type: 'success',
                content: 'Converted the file to be RAG ready!',
            })
            setDocs(docs.map(o => {
                if (o.id === id) {
                    o.processStatus = 'converted'
                }
                return o
            }))
        } else {
            messageApi.open({
                type: 'error',
                content: `Failed to convert the file to be RAG: ${await resp.text()}`,
            })
        }
        setSpinning(false)
    }
    const deleteDoc = async (id) => {
        messageApi.open({
            type: 'warning',
            content: 'Trying to delete document: ' + id,
        })
        let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/${id}`, {
            method: 'DELETE',
            mode: 'cors',
        })
        if (resp.ok) {
            setDocs(docs.filter(o => o.id !== id))
            messageApi.open({
                type: 'success',
                content: 'Deleted the file!',
            })
        } else {
            messageApi.open({
                type: 'error',
                content: `Failed to delete the file: ${await resp.text()}`,
            })
        }
    }

    const columns = [
        {
            title: 'File Name',
            dataIndex: 'fileName',
            key: 'fileName',
        },
        {
            title: 'Check Sum',
            dataIndex: 'fileChecksum',
            key: 'fileChecksum',
        },
        {
            title: 'Status',
            dataIndex: 'processStatus',
            key: 'processStatus',
            render: (_, record) => {
                if (record?.processStatus === 'uploaded') {
                    return <Flex gap='small'>
                            <span>uploaded</span>
                            <Button style={{width: '3.8rem', height: '1.5rem'}} onClick={() => {convertRag(record.id)}}>
                                Convert
                            </Button>
                        </Flex>
                } else {
                    return record?.processStatus
                }
            },
        },
        {
            title: 'Created At',
            dataIndex: 'createTime',
            key: 'createTime',
        },
        {
            title: 'Updated At',
            dataIndex: 'updateTime',
            key: 'updateTime',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => <Flex gap='small'>
                <Tooltip title='Delete the document'>
                    <Popconfirm title='Delete the doc'
                                onConfirm={() => deleteDoc(record.id)}
                                description='Are you sure to delete this document?'>
                        <Button shape={'circle'} icon={<DeleteOutlined />}/>
                    </Popconfirm>
                </Tooltip>
            </Flex>
        },
    ];

    const submitUploadRequest = async (req) => {
        let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/before`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify(req),
        })
        if (resp.ok) {
            let data = await resp.json()
            console.log("uploaded file before", data)
            return data.id
        } else {
            return null
        }
    }
    const uploadFileParts = async (data, req, id) => {
        if (req.size === 0) {
            setUploadProgress(100)
            return true
        }

        const uploadPart = async (seq, fromPos, toPos) => {
            let ur = {
                id: id,
                ext: req.fileType,
                sequence: seq,
                size: req.size,
                contentBase64: base64(data.slice(fromPos, toPos))
            }
            let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/part`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify(ur),
            })
            if (resp.ok) {
                let data = await resp.text()
                console.log("uploaded file part", data)
                setUploadProgress(Math.floor((seq + 1) / (blocks + 1) * 100))
            } else {
                messageApi.open({
                    type: 'error',
                    content: `Failed to upload the file part: ${await resp.text()}`,
                });
                return false
            }
        }

        let blocks = Math.floor(req.size / blockSize)
        let remainedBytes = req.size % blockSize
        for (let i = 0; i < blocks; i++) {
            await uploadPart(i, i * blockSize, (i + 1) * blockSize)
        }
        if (remainedBytes > 0) {
            await uploadPart(blocks, blocks * blockSize, blocks * blockSize + remainedBytes)
        }

        setUploadProgress(100)
        return true
    }

    const handleDocSelected = async () => {
        const id = 'upload-file-input'
        if (!document.getElementById(id).files[0]) {
            return;
        }
        let selected = document.getElementById(id).files[0];
        let fileName = selected.name

        console.log("selected file name: ", fileName)
        let fileType = ""
        let checksum = ""
        if (fileName.includes('.')) {
            fileType = fileName.slice(fileName.lastIndexOf('.'))
        }
        let reader = new FileReader();
        // read pdf as text, or read as images
        reader.addEventListener("loadend", async () => {
            let data = reader.result;
            checksum = md5(data)
            let req = {
                fileName: fileName,
                size: data.byteLength,
                checksum: checksum,
                fileType: fileType,
                ocr: ocr
            }
            messageApi.open({
                type: 'success',
                content: 'Loaded the file, trying to upload!',
            })
            setUploading(true)
            let id = await submitUploadRequest(req)
            setUploading(false)
            if (!id) {
                messageApi.open({
                    type: 'error',
                    content: 'Failed to upload the file!',
                })
                return
            }
            setUploading(true)
            let result = await uploadFileParts(data, req, id)
            setUploading(false)
            if (result) {
                let resp = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/after/${id}`, {
                    method: 'PATCH',
                    mode: 'cors',
                })
                if (resp.ok) {
                    let data = await resp.json()
                    messageApi.open({
                        type: 'success',
                        content: `Uploaded the file successfully!`,
                    })
                    if (docs.filter((o) => o.id === data.id).length === 0) {
                        setDocs([...docs, {
                            ...data,
                            key: data.id
                        }])
                    }
                } else {
                    messageApi.open({
                        type: 'error',
                        content: `Failed to upload the file: ${await resp.text()}`,
                    });
                }

            }
        });
        reader.readAsArrayBuffer(selected);
    }

    return <div>
        <h2>Manage Docs</h2>
        <Flex gap='small'>
            <Tooltip title='Upload files'>
                <input type="file" id='upload-file-input'
                       accept="application/pdf,image/xbm,image/jfif,image/gif,image/svg,image/jpeg,image/jpg,image/svgz,image/webp,image/png,image/bmp,image/pjp,image/apng,image/pjpeg,image/avif"
                       onChange={handleDocSelected} style={{display: 'none'}}></input>
                <Button icon={<CloudUploadOutlined/>} onClick={()=> {
                    document.getElementById('upload-file-input').click()
                }}/>
            </Tooltip>
            <Tooltip title='Use OCR for image-based docs'>
                <div style={{paddingTop: '0.2rem'}}>
                <Switch checked={ocr} onChange={setOcr} checkedChildren="OCR" unCheckedChildren='OCR'/>
                </div>
            </Tooltip>
        </Flex>
        <Flex style={{display: uploading ? 'block' : 'none'}}>
            <Spin />
            <Progress percent={uploadProgress} size="small" />
        </Flex>
        <div>
            <Table dataSource={docs}
                   rowKey={(record) => record.id}
                   columns={columns}
                   pagination={tableParams.pagination}
                   onChange={handleTableChange}
                   loading={loading}/>;
        </div>
        <Spin spinning={spinning} fullscreen />
    </div>
}

export default ManageDocs
