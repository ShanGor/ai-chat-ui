const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

/**
 * IndexedDb, assume that your key is 'id'
 */
class IndexedDb {

    constructor(dbName, version, storeName) {
        this.version = version
        this.storeName = storeName
        this.db = null
        this.dbName = dbName
    }

    async open () {
        let self = this
        return new Promise((resolve, reject) => {
            self.dbConnection = indexedDB.open(self.dbName,1);

            self.dbConnection.onsuccess = function (event) {
                self.db = event.target.result;
                resolve(self);
                console.log(`IndexedDB opened successfully for ${self.dbName}!`);
            }
            self.dbConnection.onerror = function (event) {
                console.error(`Failed to open IndexedDB for ${self.dbName}.`);
                reject(event.target.error);
            }
            self.dbConnection.onupgradeneeded = function(event) {
                self.db = event.target.result;
                resolve(self);
                if (!self.db.objectStoreNames.contains(self.dbName)) {
                    self.db.createObjectStore(self.dbName, { keyPath: 'id' });
                    console.log(`Created object store for ${self.dbName}.`);
                }
            }
        });
    }

    saveObject (obj, successFunc=(evt)=>{}, errFunc = (evt)=>{}) {
        let request = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName).put(obj);
        request.onsuccess = successFunc
        request.onerror = errFunc
    }

    deleteItemByKey (key, successFunc=(evt)=>{}, errFunc = (evt)=>{}) {
        let request = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName).delete(key);
        request.onsuccess = successFunc
        request.onerror = errFunc
    }

    deleteAll (successFunc=(evt)=>{}, errFunc = (evt)=>{}){
        let request = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName).clear();
        request.onsuccess = successFunc
        request.onerror = errFunc
    }

    getAll (successFunc=(evt)=>{}, errFunc = (evt)=>{}) {
        let request = this.db.transaction(this.storeName).objectStore(this.storeName).getAll();
        request.onsuccess = successFunc
        request.onerror = errFunc
    }

    getItemByKey (key, successFunc=(evt)=>{}, errFunc = (evt)=>{}) {
        let request = this.db.transaction(this.storeName).objectStore(this.storeName).get(key);
        request.onsuccess = successFunc
        request.onerror = errFunc
    }
}

export default IndexedDb