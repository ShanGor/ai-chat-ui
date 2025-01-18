import {useEffect, useState} from 'react';
import { Spin } from "antd";
import md5 from "md5";
import IndexedDb from "../IndexedDb"

const PlantUMLShow = ({chart}) => {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [plantumlCacheDb, setPlantumlCacheDb] = useState(null)

    useEffect(()=>{
        new IndexedDb('plantuml', 1, 'plantuml').open().then(db => setPlantumlCacheDb(db))

    }, [])

    const waitUntilDbInitialized = async () => {
        while (!plantumlCacheDb) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    const savePlantUmlToCache = (key, image) => {
        plantumlCacheDb.saveObject({id: key, value: image}, () => {
            console.log(`Data cached successfully for ${key}.`);
        }, () => {
            console.error(`Failed to cache data for ${key}.`);
        })
    }

    const tryToGetPlantUmlFromCache = async () => {
        setLoading(true)
        let key = `${md5(chart)}-${chart.length}`
        await waitUntilDbInitialized()

        plantumlCacheDb.getItemByKey(key, (evt) => {
            const result = evt.target.result;
            console.log('Data saved successfully.');
            if (result) {
                setImage(result.value)
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
        }, () => {
            console.error('Failed to get data from IndexedDB.');
        })
    }

    useEffect(() => {
        if (!chart || chart.trim() === "") return;

        tryToGetPlantUmlFromCache().then()
    }, [chart]);
    return (<div>
        {loading ? <Spin size='large'></Spin> :
            <div dangerouslySetInnerHTML={{ __html: image }} />
        }
    </div>);
};
export default PlantUMLShow;