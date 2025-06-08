const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 初始化 Firebase Admin SDK
const serviceAccount = require('../cardata-17759-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const bucket = admin.storage().bucket();

// 下載檔案
async function downloadFile(fileUrl, localPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    https.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(localPath, () => reject(err));
    });
  });
}

// 匯出所有 Storage 檔案
async function exportStorageFiles() {
  try {
    // 建立匯出目錄
    const exportDir = path.join(__dirname, '../exports/storage');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 取得所有檔案
    const [files] = await bucket.getFiles();
    console.log(`找到 ${files.length} 個檔案`);

    // 下載每個檔案
    for (const file of files) {
      const filePath = file.name;
      const localPath = path.join(exportDir, filePath);
      
      // 確保目錄存在
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 取得檔案下載 URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 分鐘
      });

      console.log(`正在下載: ${filePath}`);
      await downloadFile(url, localPath);
    }

    console.log(`所有檔案已成功匯出到: ${exportDir}`);
  } catch (error) {
    console.error('匯出檔案時發生錯誤:', error);
  } finally {
    // 關閉 Firebase 連接
    admin.app().delete();
  }
}

// 執行匯出
exportStorageFiles(); 