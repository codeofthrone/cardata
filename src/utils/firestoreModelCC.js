/**
 * Firestore 車型與CC數值關聯數據操作工具
 * 實現品牌、車型和CC數值的層級關係管理
 */

import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

/**
 * 獲取所有品牌列表
 * @returns {Promise<Array>} 品牌列表
 */
export const fetchBrands = async () => {
  try {
    const brandsRef = collection(db, "brands");
    const snapshot = await getDocs(brandsRef);
    const brandData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return brandData;
  } catch (error) {
    console.error("獲取品牌列表時出錯:", error);
    throw error;
  }
};

/**
 * 獲取特定品牌的所有車型
 * @param {string} brandId - 品牌ID
 * @returns {Promise<Array>} 車型列表
 */
export const fetchModelsByBrand = async (brandId) => {
  try {
    const modelsRef = collection(db, "models");
    const q = query(modelsRef, where("brandId", "==", brandId));
    const snapshot = await getDocs(q);
    const modelData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return modelData;
  } catch (error) {
    console.error(`獲取品牌(${brandId})的車型時出錯:`, error);
    throw error;
  }
};

/**
 * 獲取特定車型的所有CC數值
 * @param {string} modelId - 車型ID
 * @returns {Promise<Array>} CC數值列表
 */
export const fetchCCValuesByModel = async (modelId) => {
  try {
    const ccValuesRef = collection(db, "cc_values");
    const q = query(ccValuesRef, where("modelId", "==", modelId));
    const snapshot = await getDocs(q);
    const ccData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return ccData;
  } catch (error) {
    console.error(`獲取車型(${modelId})的CC數值時出錯:`, error);
    throw error;
  }
};

/**
 * 添加新品牌
 * @param {Object} brandData - 品牌數據
 * @param {string} brandData.name - 品牌名稱
 * @param {string} [brandData.logo] - 品牌logo URL
 * @returns {Promise<string>} 新品牌的ID
 */
export const addBrand = async (brandData) => {
  try {
    const brandsRef = collection(db, "brands");
    const docRef = await addDoc(brandsRef, {
      name: brandData.name,
      logo: brandData.logo || "",
      status: "active",
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("添加品牌時出錯:", error);
    throw error;
  }
};

/**
 * 添加新車型
 * @param {Object} modelData - 車型數據
 * @param {string} modelData.name - 車型名稱
 * @param {string} modelData.brandId - 關聯的品牌ID
 * @param {string} [modelData.image] - 車型圖片URL
 * @returns {Promise<string>} 新車型的ID
 */
export const addModel = async (modelData) => {
  try {
    // 先獲取品牌資訊以冗餘存儲
    const brandRef = doc(db, "brands", modelData.brandId);
    const brandDoc = await getDoc(brandRef);
    
    if (!brandDoc.exists()) {
      throw new Error("品牌不存在");
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
    return docRef.id;
  } catch (error) {
    console.error("添加車型時出錯:", error);
    throw error;
  }
};

/**
 * 添加新CC數值
 * @param {Object} ccData - CC數值數據
 * @param {number} ccData.value - CC數值
 * @param {string} ccData.modelId - 關聯的車型ID
 * @returns {Promise<string>} 新CC數值的ID
 */
export const addCCValue = async (ccData) => {
  try {
    // 先獲取車型資訊以冗餘存儲
    const modelRef = doc(db, "models", ccData.modelId);
    const modelDoc = await getDoc(modelRef);
    
    if (!modelDoc.exists()) {
      throw new Error("車型不存在");
    }
    
    const modelData = modelDoc.data();
    
    // 檢查是否已存在相同的CC數值
    const ccValuesRef = collection(db, "cc_values");
    const existingQuery = query(
      ccValuesRef, 
      where("modelId", "==", ccData.modelId),
      where("value", "==", ccData.value)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // 如果已存在，直接返回現有ID
      return existingSnapshot.docs[0].id;
    }
    
    // 添加新的CC數值
    const docRef = await addDoc(ccValuesRef, {
      value: ccData.value,
      modelId: ccData.modelId,
      modelName: modelData.name,
      brandId: modelData.brandId,
      brandName: modelData.brandName,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("添加CC數值時出錯:", error);
    throw error;
  }
};

/**
 * 根據品牌名稱和車型名稱獲取車型ID
 * @param {string} brandId - 品牌ID
 * @param {string} modelName - 車型名稱
 * @returns {Promise<string|null>} 車型ID或null
 */
export const getModelIdByName = async (brandId, modelName) => {
  try {
    const modelsRef = collection(db, "models");
    const q = query(
      modelsRef, 
      where("brandId", "==", brandId),
      where("name", "==", modelName)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].id;
  } catch (error) {
    console.error("獲取車型ID時出錯:", error);
    throw error;
  }
};

/**
 * 獲取特定車型的所有CC數值（僅返回數值列表）
 * @param {string} modelId - 車型ID
 * @returns {Promise<Array<number>>} CC數值列表
 */
export const getCCValuesByModel = async (modelId) => {
  try {
    const ccData = await fetchCCValuesByModel(modelId);
    return ccData.map(item => item.value);
  } catch (error) {
    console.error(`獲取車型(${modelId})的CC數值時出錯:`, error);
    throw error;
  }
};

/**
 * 數據遷移：從舊結構遷移到新結構
 * @returns {Promise<void>}
 */
export const migrateDataToNewStructure = async () => {
  try {
    // 1. 獲取舊結構中的品牌和車型數據
    const brandsRef = doc(db, "settings", "brands");
    const brandsDoc = await getDoc(brandsRef);
    
    if (!brandsDoc.exists()) {
      throw new Error("舊結構中的brands文檔不存在");
    }
    
    // 2. 獲取models子集合
    const modelsCollectionRef = collection(db, "settings", "brands", "models");
    const modelsSnapshot = await getDocs(modelsCollectionRef);
    
    // 3. 遍歷品牌
    for (const brandDoc of modelsSnapshot.docs) {
      const brandId = brandDoc.id;
      const brandData = brandDoc.data();
      
      // 3.1 添加品牌到新結構
      const newBrandId = await addBrand({
        name: brandId,
        logo: brandData.logo || ""
      });
      
      // 3.2 獲取該品牌的車型列表
      const modelListRef = collection(db, "settings", "brands", "models", brandId, "model_list");
      const modelListSnapshot = await getDocs(modelListRef);
      
      // 3.3 遍歷車型
      for (const modelDoc of modelListSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();
        
        // 3.4 添加車型到新結構
        const newModelId = await addModel({
          name: modelId,
          brandId: newBrandId,
          image: modelData.image || ""
        });
        
        // 3.5 如果有CC數值，也添加到新結構
        if (modelData.cc && Array.isArray(modelData.cc)) {
          for (const ccValue of modelData.cc) {
            await addCCValue({
              value: ccValue,
              modelId: newModelId
            });
          }
        }
      }
    }
    
    console.log("數據遷移完成");
  } catch (error) {
    console.error("數據遷移時出錯:", error);
    throw error;
  }
};