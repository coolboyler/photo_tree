// 使用浏览器本地存储和IndexedDB来存储图片

export interface PhotoRecord {
  id?: string;
  url: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_at?: string;
  data?: string; // Base64 encoded image data
}

// 初始化IndexedDB数据库
const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PhotoTreeDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建photos对象存储
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
};

// 获取数据库连接
const getDB = async (): Promise<IDBDatabase> => {
  return await initIndexedDB();
};

// 上传图片到本地存储（保存为Base64）
export const uploadPhotoToStorage = async (file: File): Promise<string> => {
  try {
    console.log('开始上传文件:', file.name);

    // 将文件转换为Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 生成唯一ID
    const id = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const url = `data:${file.type};base64,${base64Data.split(',')[1]}`;

    console.log('文件转换完成，大小:', base64Data.length, '字符');
    return url;
  } catch (error) {
    console.error('转换图片失败:', error);
    throw error;
  }
};

// 保存图片记录到IndexedDB
export const savePhotoRecord = async (photoData: Omit<PhotoRecord, 'id' | 'created_at'>): Promise<PhotoRecord> => {
  try {
    console.log('保存图片记录到IndexedDB:', photoData);

    const db = await getDB();
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    const record: PhotoRecord = {
      ...photoData,
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(record);

      request.onsuccess = () => {
        const id = request.result as string;
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const savedRecord = getRequest.result;
          console.log('图片记录保存成功:', savedRecord);
          resolve(savedRecord);
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('保存图片记录失败:', error);
    throw error;
  }
};

// 获取所有图片记录
export const getAllPhotos = async (): Promise<PhotoRecord[]> => {
  try {
    console.log('开始获取所有图片记录...');

    const db = await getDB();
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const index = store.index('created_at');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // 从最新到最旧
      const records: PhotoRecord[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          records.push(cursor.value);
          cursor.continue();
        } else {
          console.log('获取到图片记录:', records.length, '条');
          resolve(records);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return [];
  }
};

// 删除图片
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const request = store.delete(photoId);

      request.onsuccess = () => {
        console.log('图片删除成功:', photoId);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    throw error;
  }
};

// 批量上传图片
export const uploadMultiplePhotos = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    try {
      // 转换为Base64 URL
      const publicUrl = await uploadPhotoToStorage(file);

      // 保存记录到IndexedDB
      await savePhotoRecord({
        url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      });

      urls.push(publicUrl);
    } catch (error) {
      console.error(`上传文件 ${file.name} 失败:`, error);
      // 继续处理其他文件
    }
  }

  return urls;
};

// 清理过期的Base64数据（可选）
export const cleanupOldPhotos = async (maxAgeDays: number = 30): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const index = store.index('created_at');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value;
          const recordDate = new Date(record.created_at);

          if (recordDate < cutoffDate) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          console.log('清理完成');
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('清理图片失败:', error);
  }
};