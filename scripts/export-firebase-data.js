const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 初始化 Firebase Admin SDK
const serviceAccount = require('../cardata-17759-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportAllCollectionsRecursive(collectionPath, exportData) {
  const colSnap = await db.collection(collectionPath).get();
  exportData[collectionPath] = [];
  for (const doc of colSnap.docs) {
    const docData = { id: doc.id, ...doc.data() };
    exportData[collectionPath].push(docData);

    // 遞迴所有子集合
    const subcollections = await db.collection(collectionPath).doc(doc.id).listCollections();
    for (const subcol of subcollections) {
      await exportAllCollectionsRecursive(`${collectionPath}/${doc.id}/${subcol.id}`, exportData);
    }
  }
}

// 取得所有 root 集合名稱
async function getRootCollections() {
  const collections = await db.listCollections();
  return collections.map(col => col.id);
}

async function exportAll() {
  try {
    const exportData = {};
    const rootCollections = await getRootCollections();
    for (const collectionName of rootCollections) {
      console.log(`正在匯出 ${collectionName} ...`);
      await exportAllCollectionsRecursive(collectionName, exportData);
    }

    // 建立匯出目錄
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // 儲存匯出檔案
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `firebase-export-${timestamp}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`資料已成功匯出到: ${exportPath}`);
  } catch (error) {
    console.error('匯出資料時發生錯誤:', error);
  } finally {
    admin.app().delete();
  }
}

exportAll(); 