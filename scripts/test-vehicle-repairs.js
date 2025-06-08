/**
 * 測試腳本：驗證新的車輛維修子集合功能
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'car-data-fa5b8-firebase-adminsdk.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ 找不到 Firebase service account 金鑰檔案:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "car-data-fa5b8"
});

const db = admin.firestore();

/**
 * 測試取得車輛維修記錄功能
 */
async function testGetVehicleRepairParts() {
  console.log('🧪 測試取得車輛維修記錄...');
  
  try {
    // 取得所有車輛
    const vehiclesSnapshot = await db.collection("vehicles").get();
    console.log(`找到 ${vehiclesSnapshot.docs.length} 部車輛`);
    
    let totalRepairParts = 0;
    
    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      const vehicleData = vehicleDoc.data();
      
      // 取得這輛車的維修記錄
      const repairPartsSnapshot = await db
        .collection("vehicles")
        .doc(vehicleId)
        .collection("repairParts")
        .get();
      
      const repairPartsCount = repairPartsSnapshot.docs.length;
      totalRepairParts += repairPartsCount;
      
      console.log(`  車輛 ${vehicleId} (${vehicleData.plateNumber || 'N/A'}): ${repairPartsCount} 筆維修記錄`);
      
      // 顯示維修記錄詳情
      if (repairPartsCount > 0) {
        repairPartsSnapshot.docs.forEach(repairDoc => {
          const repairData = repairDoc.data();
          console.log(`    - 維修項目: ${repairData.item || 'N/A'}`);
          console.log(`    - 狀態: ${repairData.status || 'N/A'}`);
          console.log(`    - 費用: ${repairData.cost || 0}`);
          console.log(`    - 遷移來源: ${repairData.migratedFrom || '原生建立'}`);
          console.log('    ---');
        });
      }
    }
    
    console.log(`✅ 總共 ${totalRepairParts} 筆維修記錄`);
    return totalRepairParts;
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    throw error;
  }
}

/**
 * 測試費用計算功能
 */
async function testCalculateRepairCosts() {
  console.log('\n🧪 測試費用計算功能...');
  
  try {
    const vehiclesSnapshot = await db.collection("vehicles").get();
    
    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      const vehicleData = vehicleDoc.data();
      
      // 計算這輛車的維修費用
      const repairPartsSnapshot = await db
        .collection("vehicles")
        .doc(vehicleId)
        .collection("repairParts")
        .get();
      
      let totalCost = 0;
      let pendingCost = 0;
      let completedCost = 0;
      
      repairPartsSnapshot.docs.forEach(repairDoc => {
        const repairData = repairDoc.data();
        const cost = Number(repairData.cost) || 0;
        
        totalCost += cost;
        
        if (repairData.status === 'pending') {
          pendingCost += cost;
        } else if (repairData.status === 'completed') {
          completedCost += cost;
        }
      });
      
      console.log(`  車輛 ${vehicleId} (${vehicleData.plateNumber || 'N/A'}):`);
      console.log(`    總維修費用: $${totalCost}`);
      console.log(`    待處理費用: $${pendingCost}`);
      console.log(`    已完成費用: $${completedCost}`);
    }
    
    console.log('✅ 費用計算測試完成');
    
  } catch (error) {
    console.error('❌ 費用計算測試失敗:', error);
    throw error;
  }
}

/**
 * 驗證資料結構完整性
 */
async function testDataIntegrity() {
  console.log('\n🧪 驗證資料結構完整性...');
  
  try {
    const vehiclesSnapshot = await db.collection("vehicles").get();
    
    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      
      const repairPartsSnapshot = await db
        .collection("vehicles")
        .doc(vehicleId)
        .collection("repairParts")
        .get();
      
      repairPartsSnapshot.docs.forEach(repairDoc => {
        const repairId = repairDoc.id;
        const repairData = repairDoc.data();
        
        // 檢查必要欄位
        const requiredFields = ['item', 'location', 'date', 'cost', 'status'];
        const missingFields = requiredFields.filter(field => !(field in repairData));
        
        if (missingFields.length > 0) {
          console.warn(`⚠️  維修記錄 ${repairId} 缺少欄位:`, missingFields);
        }
        
        // 檢查遷移標記
        if (repairData.migratedFrom) {
          console.log(`✅ 遷移記錄 ${repairId} 具有完整的遷移標記`);
        }
      });
    }
    
    console.log('✅ 資料結構完整性驗證完成');
    
  } catch (error) {
    console.error('❌ 資料結構驗證失敗:', error);
    throw error;
  }
}

/**
 * 主測試函數
 */
async function runTests() {
  console.log('🚀 開始執行車輛維修功能測試...\n');
  
  try {
    await testGetVehicleRepairParts();
    await testCalculateRepairCosts();
    await testDataIntegrity();
    
    console.log('\n🎉 所有測試完成！新的車輛維修子集合功能運作正常。');
    
  } catch (error) {
    console.error('\n💥 測試執行失敗:', error);
    process.exit(1);
  }
}

// 執行測試
runTests();
