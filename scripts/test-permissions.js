/**
 * 簡單測試腳本：檢查 Firestore 權限
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  limit 
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase 配置（使用與 .env 相同的項目）
const firebaseConfig = {
  apiKey: "AIzaSyB2pm-3FYDBp5EWYju_trv6wQGYjPZEJwo",
  authDomain: "cardata-17759.firebaseapp.com",
  projectId: "cardata-17759",
  storageBucket: "cardata-17759.appspot.com",
  messagingSenderId: "344330794379",
  appId: "1:344330794379:web:ee3a7093fd9fb1b490eb8e"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testPermissions() {
  try {
    console.log('🔐 測試登入...');
    
    // 使用測試帳號登入
    const userCredential = await signInWithEmailAndPassword(auth, 'a062977sweet+2@gmail.com', '123456');
    console.log('✅ 登入成功:', userCredential.user.email);
    
    console.log('\n🚗 測試車輛集合權限...');
    
    // 測試讀取車輛集合
    const vehiclesRef = collection(db, "vehicles");
    const vehiclesQuery = query(vehiclesRef, limit(1));
    const vehiclesSnapshot = await getDocs(vehiclesQuery);
    
    console.log(`✅ 成功讀取車輛集合，找到 ${vehiclesSnapshot.docs.length} 部車輛`);
    
    if (vehiclesSnapshot.docs.length > 0) {
      const vehicleDoc = vehiclesSnapshot.docs[0];
      const vehicleId = vehicleDoc.id;
      const vehicleData = vehicleDoc.data();
      
      console.log(`\n🔧 測試車輛 ${vehicleId} (${vehicleData.plateNumber || 'N/A'}) 的維修部件子集合...`);
      
      // 測試讀取維修部件子集合
      const repairPartsRef = collection(db, "vehicles", vehicleId, "repairParts");
      const repairPartsSnapshot = await getDocs(repairPartsRef);
      
      console.log(`✅ 成功讀取維修部件子集合，找到 ${repairPartsSnapshot.docs.length} 筆記錄`);
      
      if (repairPartsSnapshot.docs.length > 0) {
        const repairDoc = repairPartsSnapshot.docs[0];
        const repairData = repairDoc.data();
        console.log('維修記錄詳情:', {
          id: repairDoc.id,
          item: repairData.item,
          status: repairData.status,
          cost: repairData.cost
        });
      }
    }
    
    console.log('\n🎉 所有權限測試完成！');
    
  } catch (error) {
    console.error('❌ 權限測試失敗:', error);
    
    if (error.code === 'permission-denied') {
      console.error('🚫 這是權限拒絕錯誤。請檢查 Firestore 規則是否正確部署。');
    }
  }
}

testPermissions();
