require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 初始化 Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const bucket = admin.storage().bucket();

// 上傳檔案到 Storage
async function uploadFile(localPath, destination) {
  try {
    await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType: getContentType(localPath)
      }
    });
    console.log(`已上傳: ${destination}`);
  } catch (error) {
    console.error(`上傳 ${destination} 時發生錯誤:`, error);
  }
}

// 取得檔案類型
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// 匯入所有 Storage 檔案
async function importStorageFiles() {
  try {
    const storageDir = path.join(__dirname, '../exports/storage');
    if (!fs.existsSync(storageDir)) {
      throw new Error('找不到 storage 目錄');
    }

    // 遞迴讀取所有檔案
    async function processDirectory(dir, basePath = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          await processDirectory(fullPath, relativePath);
        } else {
          const destination = relativePath.replace(/\\/g, '/');
          await uploadFile(fullPath, destination);
        }
      }
    }

    await processDirectory(storageDir);
    console.log('所有檔案匯入完成！');
  } catch (error) {
    console.error('匯入檔案時發生錯誤:', error);
  } finally {
    // 關閉 Firebase 連接
    admin.app().delete();
  }
}

// 執行匯入
importStorageFiles(); 

// 遞迴建立集合與文件
async function importCollectionRecursive(collectionPath, documents) {
  for (const doc of documents) {
    const { id, ...data } = doc;
    const pathParts = collectionPath.split('/');
    let ref = db;
    for (let i = 0; i < pathParts.length; i += 2) {
      const col = pathParts[i];
      const docId = pathParts[i + 1];
      if (docId) {
        ref = ref.collection(col).doc(docId);
      } else {
        ref = ref.collection(col);
      }
    }
    if (ref instanceof admin.firestore.CollectionReference) {
      await ref.doc(id).set(data);
    } else {
      await ref.set(data);
    }
  }
}

async function importData() {
  try {
    // ...（讀取 exportData 的程式碼不變）

    // 匯入每個集合的資料
    for (const [collectionPath, documents] of Object.entries(exportData)) {
      console.log(`正在匯入 ${collectionPath} ...`);
      await importCollectionRecursive(collectionPath, documents);
      console.log(`已匯入 ${documents.length} 筆資料到 ${collectionPath}`);
    }

    console.log('資料匯入完成！');
  } catch (error) {
    console.error('匯入資料時發生錯誤:', error);
  } finally {
    admin.app().delete();
  }
}