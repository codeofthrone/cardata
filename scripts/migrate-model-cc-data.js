/**
 * Firestore 車型與CC數值關聯數據遷移腳本
 * 用於將舊的數據結構遷移到新的優化結構
 */

// 導入Firebase配置和工具函數
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// 導入dotenv以讀取環境變量
require('dotenv').config();

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 添加品牌到新結構
 * @param {Object} brandData - 品牌數據
 * @returns {Promise<string>} - 新品牌的ID
 */
async function addBrand(brandData) {
  try {
    const brandsRef = collection(db, "brands");
    const docRef = await addDoc(brandsRef, {
      name: brandData.name,
      logo: brandData.logo || "",
      status: "active",
      createdAt: serverTimestamp()
    });
    console.log(`品牌 ${brandData.name} 添加成功，ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`添加品牌 ${brandData.name} 時出錯:`, error);
    throw error;
  }
}

/**
 * 添加車型到新結構
 * @param {Object} modelData - 車型數據
 * @returns {Promise<string>} - 新車型的ID
 */
async function addModel(modelData) {
  try {
    // 先獲取品牌資訊以冗餘存儲
    const brandRef = doc(db, "brands", modelData.brandId);
    const brandDoc = await getDoc(brandRef);
    
    if (!brandDoc.exists()) {
      throw new Error(`品牌 ID ${modelData.brandId} 不存在`);
    }
    
    const brandName = brandDoc.data().name;
    
    const modelsRef = collection(db, "models");
    const docRef = await addDoc(modelsRef, {
      name: modelData.name,
      brandId: modelData.brandId,
      brandName: brandName,
      image: modelData.image || "",
      status: "active",
      createdAt: serverTimestamp()
    });
    console.log(`車型 ${modelData.name} 添加成功，ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`添加車型 ${modelData.name} 時出錯:`, error);
    throw error;
  }
}

/**
 * 添加CC數值到新結構
 * @param {Object} ccData - CC數值數據
 * @returns {Promise<string>} - 新CC數值的ID
 */
async function addCCValue(ccData) {
  try {
    // 先獲取車型資訊以冗餘存儲
    const modelRef = doc(db, "models", ccData.modelId);
    const modelDoc = await getDoc(modelRef);
    
    if (!modelDoc.exists()) {
      throw new Error(`車型 ID ${ccData.modelId} 不存在`);
    }
    
    const modelData = modelDoc.data();
    
    const ccValuesRef = collection(db, "cc_values");
    const docRef = await addDoc(ccValuesRef, {
      value: ccData.value,
      modelId: ccData.modelId,
      modelName: modelData.name,
      brandId: modelData.brandId,
      brandName: modelData.brandName,
      createdAt: serverTimestamp()
    });
    console.log(`CC數值 ${ccData.value} 添加成功，ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`添加CC數值 ${ccData.value} 時出錯:`, error);
    throw error;
  }
}

/**
 * 從舊結構遷移數據到新結構
 */
async function migrateData() {
  try {
    console.log("開始數據遷移...");
    
    // 1. 獲取舊結構中的品牌和車型數據
    const brandsRef = doc(db, "settings", "brands");
    const brandsDoc = await getDoc(brandsRef);
    
    if (!brandsDoc.exists()) {
      throw new Error("舊結構中的brands文檔不存在");
    }
    
    // 2. 獲取models子集合
    const modelsCollectionRef = collection(db, "settings", "brands", "models");
    const modelsSnapshot = await getDocs(modelsCollectionRef);
    
    // 用於存儲品牌ID映射（舊ID -> 新ID）
    const brandIdMap = {};
    // 用於存儲車型ID映射（舊ID -> 新ID）
    const modelIdMap = {};
    
    // 3. 遍歷品牌
    console.log(`找到 ${modelsSnapshot.docs.length} 個品牌，開始遷移...`);
    
    for (const brandDoc of modelsSnapshot.docs) {
      const brandId = brandDoc.id;
      const brandData = brandDoc.data();
      
      console.log(`處理品牌: ${brandId}`);
      
      // 3.1 添加品牌到新結構
      const newBrandId = await addBrand({
        name: brandId,
        logo: brandData.logo || ""
      });
      
      // 存儲品牌ID映射
      brandIdMap[brandId] = newBrandId;
      
      // 3.2 獲取該品牌的車型列表
      const modelListRef = collection(db, "settings", "brands", "models", brandId, "model_list");
      const modelListSnapshot = await getDocs(modelListRef);
      
      console.log(`品牌 ${brandId} 有 ${modelListSnapshot.docs.length} 個車型`);
      
      // 3.3 遍歷車型
      for (const modelDoc of modelListSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();
        
        console.log(`處理車型: ${modelId}`);
        
        // 3.4 添加車型到新結構
        const newModelId = await addModel({
          name: modelId,
          brandId: newBrandId,
          image: modelData.image || ""
        });
        
        // 存儲車型ID映射
        modelIdMap[`${brandId}_${modelId}`] = newModelId;
        
        // 3.5 如果有CC數值，也添加到新結構
        if (modelData.cc && Array.isArray(modelData.cc)) {
          console.log(`車型 ${modelId} 有 ${modelData.cc.length} 個CC數值`);
          
          for (const ccValue of modelData.cc) {
            await addCCValue({
              value: parseInt(ccValue, 10),
              modelId: newModelId
            });
          }
        }
      }
    }
    
    console.log("數據遷移完成！");
    console.log("品牌ID映射:", brandIdMap);
    console.log("車型ID映射:", modelIdMap);
    
  } catch (error) {
    console.error("數據遷移時出錯:", error);
  }
}

// 執行遷移
migrateData().then(() => {
  console.log("遷移腳本執行完畢");
  process.exit(0);
}).catch(error => {
  console.error("遷移腳本執行失敗:", error);
  process.exit(1);
});