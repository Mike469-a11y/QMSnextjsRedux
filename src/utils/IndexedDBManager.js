// IndexedDB Manager for File Storage
class IndexedDBManager {
    constructor() {
        this.dbName = 'SourcingSystemDB';
        this.version = 1;
        this.db = null;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create attachments store
                if (!db.objectStoreNames.contains('attachments')) {
                    const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
                    attachmentStore.createIndex('vendorId', 'vendorId', { unique: false });
                    attachmentStore.createIndex('qmsId', 'qmsId', { unique: false });
                }

                // Create sourcing data store
                if (!db.objectStoreNames.contains('sourcingData')) {
                    db.createObjectStore('sourcingData', { keyPath: 'qmsId' });
                }
            };
        });
    }

    async saveAttachment(attachment) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attachments'], 'readwrite');
            const store = transaction.objectStore('attachments');
            const request = store.put(attachment);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttachment(id) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attachments'], 'readonly');
            const store = transaction.objectStore('attachments');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttachmentsByVendor(vendorId, qmsId) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attachments'], 'readonly');
            const store = transaction.objectStore('attachments');
            const index = store.index('vendorId');
            const request = index.getAll(vendorId);

            request.onsuccess = () => {
                const results = request.result.filter(att => att.qmsId === qmsId);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAttachment(id) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attachments'], 'readwrite');
            const store = transaction.objectStore('attachments');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async saveSourcingData(qmsId, data) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sourcingData'], 'readwrite');
            const store = transaction.objectStore('sourcingData');
            const request = store.put({ qmsId, data, lastUpdated: new Date() });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSourcingData(qmsId) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sourcingData'], 'readonly');
            const store = transaction.objectStore('sourcingData');
            const request = store.get(qmsId);

            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    }

    // File compression utility
    async compressImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Generate unique ID for attachments
    generateAttachmentId() {
        return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default new IndexedDBManager();