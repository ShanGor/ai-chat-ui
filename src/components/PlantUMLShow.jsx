import {useEffect, useState} from 'react';
import { Spin } from "antd";
import md5 from "md5";

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
const dbName = 'plantuml'
let dbOpenStatus = 'waiting'
const dbConnection = indexedDB.open(dbName,1);
let plantumlCacheDb
dbConnection.onsuccess = function () {
    plantumlCacheDb = dbConnection.result;
    dbOpenStatus = 'success'
    console.log('IndexedDB opened successfully!');
}
dbConnection.onerror = function () {
    dbOpenStatus = 'failed'
    console.error('Failed to open IndexedDB.');
}
dbConnection.onupgradeneeded = function(event) {
    plantumlCacheDb = event.target.result;
    if (!plantumlCacheDb.objectStoreNames.contains(dbName)) {
        plantumlCacheDb.createObjectStore(dbName, { keyPath: 'id' });
        console.log(`Created object store for ${dbName}.`);
    }
}


const PlantUMLShow = ({chart}) => {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [plantumlDb, setPlantumlDb] = useState(plantumlCacheDb)
    useEffect(() => {
        const checkDb = () => {
            if (dbOpenStatus === 'waiting') {
                setTimeout(checkDb, 100)
            } else if (dbOpenStatus === 'success') {
                setPlantumlDb(plantumlCacheDb)
            }
        }

        checkDb()
    }, [])

    const savePlantUmlToCache = (key, image) => {
        let request = plantumlDb.transaction([dbName], "readwrite").objectStore(dbName).put({id: key, value: image})
        request.onsuccess = function() {
            console.log(`Data cached successfully for ${key}.`);
        };
        request.onerror = function() {
            console.error('Failed to save data to IndexedDB.');
        }
    }

    const tryToGetPlantUmlFromCache = () => {
        setLoading(true)
        let key = `${md5(chart)}-${chart.length}`

        let request = plantumlDb.transaction([dbName], "readwrite").objectStore(dbName).get(key);
        request.onsuccess = function() {
            console.log('Data saved successfully.');
            if (request.result) {
                setImage(request.result.value)
                setLoading(false)
            } else {
                fetch(`${import.meta.env.VITE_API_URL}/plantuml`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: chart
                }).then(response => response.text()).then(image => {
                    setImage(image)
                    setLoading(false)
                    savePlantUmlToCache(key, image)
                })
            }
        };
        request.onerror = function() {
            console.error('Failed to get data from IndexedDB.');
        }

    }

    useEffect(() => {
        if (!chart || chart.trim() === "") return;

        tryToGetPlantUmlFromCache()
    }, [chart]);
    return (<div>
        {loading ? <Spin size='large'></Spin> :
            <div dangerouslySetInnerHTML={{ __html: image }} />
        }
    </div>);
};
export default PlantUMLShow;