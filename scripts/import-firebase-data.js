const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'car-data-fa5b8-firebase-adminsdk.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`錯誤：找不到服務帳號金鑰檔案: ${serviceAccountPath}`);
  console.error('請確保你已經下載了 Firebase 服務帳號金鑰檔案，並將其放在專案根目錄中。');
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('初始化 Firebase Admin SDK 時發生錯誤:', error);
  process.exit(1);
}

const db = admin.firestore();

// 等待函數
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 重試函數
async function retry(fn, retries = 3, delay = 5000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`操作失敗，${retries} 秒後重試...`);
    console.error('錯誤詳情:', error.message);
    
    if (error.message.includes('API has not been used') || 
        error.message.includes('SERVICE_DISABLED')) {
      console.log('\n請確保你已經：');
      console.log('1. 啟用了 Firestore API：');
      console.log('   https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=car-data-fa5b8');
      console.log('2. 在 Firebase Console 中初始化了 Firestore 資料庫');
      console.log('3. 等待了幾分鐘讓設定生效\n');
    }
    
    await wait(delay);
    return retry(fn, retries - 1, delay);
  }
}

// 匯入資料到 Firestore
async function importData() {
  try {
    // 讀取匯出檔案
    const exportDir = path.join(__dirname, '../exports');
    const files = fs.readdirSync(exportDir)
      .filter(file => file.startsWith('firebase-export-') && file.endsWith('.json'))
      .sort()
      .reverse(); // 取得最新的匯出檔案

    if (files.length === 0) {
      throw new Error('找不到匯出檔案');
    }

    const latestExport = files[0];
    console.log(`使用匯出檔案: ${latestExport}`);

    const exportPath = path.join(exportDir, latestExport);
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

    // 匯入每個集合的資料
    for (const [collectionName, documents] of Object.entries(exportData)) {
      console.log(`正在匯入 ${collectionName} 集合...`);
      
      // 使用批次寫入以提高效率
      const batch = db.batch();
      let operationCount = 0;
      const batchSize = 500; // Firestore 批次寫入限制為 500 個操作

      for (const doc of documents) {
        const { id, ...data } = doc;
        const docRef = db.collection(collectionName).doc(id);
        batch.set(docRef, data);
        operationCount++;

        // 當達到批次限制時，提交並創建新的批次
        if (operationCount === batchSize) {
          await retry(() => batch.commit());
          console.log(`已匯入 ${operationCount} 筆資料到 ${collectionName}`);
          operationCount = 0;
        }
      }

      // 提交剩餘的批次
      if (operationCount > 0) {
        await retry(() => batch.commit());
        console.log(`已匯入 ${operationCount} 筆資料到 ${collectionName}`);
      }
    }

    console.log('資料匯入完成！');
  } catch (error) {
    console.error('匯入資料時發生錯誤:', error);
  } finally {
    // 關閉 Firebase 連接
    admin.app().delete();
  }
}

// 執行匯入
importData(); 