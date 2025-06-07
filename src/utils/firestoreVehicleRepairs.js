import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Timestamp } from "firebase/firestore";

/**
 * 車輛維修部件資料結構 (現在為車輛文檔中的陣列元素)
 * @typedef {Object} VehicleRepairPart
 * @property {string} [id] - 維修部件的唯一ID (可選，對於舊資料可能不存在)
 * @property {string} item - 維修項目 (在 Firestore 中對應 'part')
 * @property {string} location - 維修地點
 * @property {string} date - 維修日期
 * @property {string} partNumber - 料號
 * @property {number} cost - 費用
 * @property {string} status - 狀態 (pending/done)
 * @property {string} [invoiceUrl] - 發票/照片連結
 * @property {string} userId - 建立者用戶ID
 * @property {Date} createdAt - 建立時間
 * @property {Date} updatedAt - 更新時間
 */

/**
 * 新增車輛維修部件
 * @param {string} vehicleId - 車輛ID
 * @param {Object} repairData - 維修部件資料 (不包含ID、createdAt、updatedAt)
 * @returns {Promise<string>} 維修部件文檔ID
 */
export const addVehicleRepairPart = async (vehicleId, repairData) => {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
      throw new Error("Vehicle document not found.");
    }

    const newRepairPartId = doc(collection(db, "temp")).id; // 生成一個唯一的ID
    
    const newRepairPart = {
      id: newRepairPartId,
      // 將傳入的 item 轉換為 Firestore 的 part 欄位
      part: repairData.item, 
      location: repairData.location,
      date: repairData.date,
      partNumber: repairData.partNumber,
      cost: parseFloat(repairData.cost),
      status: repairData.status,
      invoiceUrl: repairData.invoiceUrl || '',
      userId: repairData.userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await updateDoc(vehicleRef, {
      repairParts: arrayUnion(newRepairPart)
    });

    console.log(`新增維修部件成功，ID: ${newRepairPartId}`);
    return newRepairPartId;
  } catch (error) {
    console.error("新增車輛維修部件時出錯:", error);
    throw error;
  }
};

/**
 * 取得指定車輛的所有維修部件
 * @param {string} vehicleId - 車輛ID
 * @param {string} status - 可選的狀態篩選 (pending/done)
 * @returns {Promise<Array>} 維修部件陣列
 */
export const getVehicleRepairParts = async (vehicleId, status = null) => {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
      return []; // 如果找不到車輛，則返回空陣列
    }

    let repairParts = vehicleSnap.data().repairParts || [];

    if (status) {
      repairParts = repairParts.filter(part => part.status === status);
    }
    
    // 依 createdAt 排序，如果存在的話。同時確保 'item' 欄位存在
    repairParts.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    // 為每個維修部件添加 vehicleId 並將 Firestore 的 'part' 欄位映射到 'item'
    return repairParts.map(part => ({
      id: part.id || '', // 確保有 ID 欄位，對於舊資料可能為空
      item: part.part || '', // 將 Firestore 的 'part' 映射到 'item'
      location: part.location || '',
      date: part.date || '',
      partNumber: part.partNumber || '',
      cost: parseFloat(part.cost) || 0,
      status: (part.status === 'done') ? 'done' : 'pending',
      invoiceUrl: part.invoiceUrl || '',
      userId: part.userId || '',
      createdAt: (part.createdAt instanceof Timestamp) ? part.createdAt : null, // 確保 createdAt 是 Timestamp 或 null
      updatedAt: (part.updatedAt instanceof Timestamp) ? part.updatedAt : null, // 確保 updatedAt 是 Timestamp 或 null
      vehicleId: vehicleId
    }));

  } catch (error) {
    console.error("取得車輛維修部件時出錯:", error);
    throw error;
  }
};

/**
 * 取得所有車輛的維修部件（用於總覽頁面）
 * @param {string} status - 可選的狀態篩選 (pending/done)
 * @param {string} userCompany - 可選的公司篩選
 * @returns {Promise<Array>} 所有維修部件陣列
 */
export const getAllVehicleRepairParts = async (status = null, userCompany = null) => {
  try {
    const vehiclesRef = collection(db, "vehicles");
    let vehiclesQuery = vehiclesRef;
    
    if (userCompany) {
      vehiclesQuery = query(vehiclesRef, where("company", "==", userCompany));
    }
    
    const vehiclesSnapshot = await getDocs(vehiclesQuery);
    const allRepairParts = [];
    
    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleId = vehicleDoc.id;
      const vehicleData = vehicleDoc.data();
      const vehicleRepairParts = vehicleData.repairParts || [];

      let filteredParts = vehicleRepairParts;
      if (status) {
        filteredParts = vehicleRepairParts.filter(part => part.status === status);
      }

      // 為每個維修部件加入車輛資訊，並將 Firestore 的 'part' 欄位映射到 'item'
      const repairPartsWithVehicleInfo = filteredParts.map(part => ({
        id: part.id || '', // 確保有 ID 欄位，對於舊資料可能為空
        item: part.part || '', // 將 Firestore 的 'part' 映射到 'item'
        location: part.location || '',
        date: part.date || '',
        partNumber: part.partNumber || '',
        cost: parseFloat(part.cost) || 0,
        status: (part.status === 'done') ? 'done' : 'pending',
        invoiceUrl: part.invoiceUrl || '',
        userId: part.userId || '',
        createdAt: (part.createdAt instanceof Timestamp) ? part.createdAt : null, // 確保 createdAt 是 Timestamp 或 null
        updatedAt: (part.updatedAt instanceof Timestamp) ? part.updatedAt : null, // 確保 updatedAt 是 Timestamp 或 null
        vehicleId: vehicleId,
        vehicle: {
          id: vehicleId,
          plateNumber: vehicleData.plateNumber,
          brand: vehicleData.brand,
          model: vehicleData.model,
          company: vehicleData.company
        }
      }));
      allRepairParts.push(...repairPartsWithVehicleInfo);
    }
    
    // 依 createdAt 排序
    allRepairParts.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    
    return allRepairParts;
  } catch (error) {
    console.error("取得所有車輛維修部件時出錯:", error);
    throw error;
  }
};

/**
 * 更新車輛維修部件
 * @param {string} vehicleId - 車輛ID
 * @param {string} repairPartId - 維修部件的ID (由前端生成或來自Firestore)
 * @param {Object} updateData - 要更新的資料 (可能包含 item, location, date, partNumber, cost, status)
 * @param {Object} [identifyingProps] - 用於識別舊資料的屬性: { item: string, cost: number }
 * @returns {Promise<void>}
 */
export const updateVehicleRepairPart = async (vehicleId, repairPartId, updateData, identifyingProps = {}) => {
  try {
    console.log("updateVehicleRepairPart called:", {
      vehicleId,
      repairPartId,
      updateData,
      identifyingProps,
    });
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
      throw new Error("Vehicle document not found for update.");
    }

    const currentRepairParts = vehicleSnap.data().repairParts || [];
    console.log("Current Repair Parts from Firestore:", currentRepairParts);
    let updatedPartIndex = -1;
    let partToUpdate = null;

    // 嘗試根據 ID 找到項目
    if (repairPartId) {
      updatedPartIndex = currentRepairParts.findIndex(part => part.id === repairPartId);
      console.log(`Attempted to find by ID (${repairPartId}), index: ${updatedPartIndex}`);
    }

    // 如果沒有找到 ID 或 ID 不存在 (舊資料情況)，則嘗試根據 item 和 cost 找到項目
    if (updatedPartIndex === -1 && identifyingProps.item && identifyingProps.cost !== undefined) {
      // 注意：這裡假設前端傳來的 identifyingProps.item 對應 Firestore 的 part 欄位
      updatedPartIndex = currentRepairParts.findIndex(part => 
        part.part === identifyingProps.item && parseFloat(part.cost) === parseFloat(identifyingProps.cost)
      );
      console.log(`Attempted to find by item/cost (${identifyingProps.item}/${identifyingProps.cost}), index: ${updatedPartIndex}`);
    }

    if (updatedPartIndex === -1) {
      throw new Error("Repair part not found in vehicle's repairParts array.");
    }

    partToUpdate = { ...currentRepairParts[updatedPartIndex] };

    // 如果更新資料中包含 'item'，則將其映射為 Firestore 的 'part' 欄位
    if (updateData.item !== undefined) {
      partToUpdate.part = updateData.item;
      delete updateData.item; // 移除原始的 item 欄位，避免衝突
    }

    // 確保 createdAt 和 updatedAt 總是 Firestore Timestamp 物件
    const finalCreatedAt = (partToUpdate.createdAt instanceof Timestamp) 
                           ? partToUpdate.createdAt 
                           : Timestamp.now();
    const finalUpdatedAt = Timestamp.now();

    // 建立一個暫時物件，避免攜帶任何無效的 FieldValue (例如 serverTimestamp())
    const sanitizedPartToUpdate = { ...partToUpdate };
    if (sanitizedPartToUpdate.createdAt && !(sanitizedPartToUpdate.createdAt instanceof Timestamp)) {
        delete sanitizedPartToUpdate.createdAt;
    }
    if (sanitizedPartToUpdate.updatedAt && !(sanitizedPartToUpdate.updatedAt instanceof Timestamp)) {
        delete sanitizedPartToUpdate.updatedAt;
    }

    // 合併更新資料
    const mergedUpdateData = {
      ...sanitizedPartToUpdate, // 使用已淨化的物件
      ...updateData,
      createdAt: finalCreatedAt,
      updatedAt: finalUpdatedAt,
    };
    
    const newRepairPartsArray = [...currentRepairParts];
    newRepairPartsArray[updatedPartIndex] = mergedUpdateData;

    await updateDoc(vehicleRef, {
      repairParts: newRepairPartsArray
    });

    console.log(`更新維修部件成功，ID: ${repairPartId || identifyingProps.item}`);
  } catch (error) {
    console.error("更新車輛維修部件時出錯:", error);
    throw error;
  }
};

/**
 * 更新車輛維修部件狀態
 * @param {string} vehicleId - 車輛ID
 * @param {string} repairPartId - 維修部件ID
 * @param {string} status - 新狀態 (pending/done)
 * @param {string} [item] - 維修項目 (用於識別舊資料)
 * @param {number} [cost] - 費用 (用於識別舊資料)
 * @returns {Promise<void>}
 */
export const updateVehicleRepairPartStatus = async (vehicleId, repairPartId, status, item = null, cost = null) => {
  try {
    await updateVehicleRepairPart(vehicleId, repairPartId, { status }, { item, cost });
    console.log(`更新維修部件狀態成功，ID: ${repairPartId}，狀態: ${status}`);
  } catch (error) {
    console.error("更新車輛維修部件狀態時出錯:", error);
    throw error;
  }
};

/**
 * 刪除車輛維修部件
 * @param {string} vehicleId - 車輛ID
 * @param {string} repairPartId - 維修部件的ID (由前端生成或來自Firestore)
 * @param {Object} [identifyingProps] - 用於識別舊資料的屬性: { item: string, cost: number }
 * @returns {Promise<void>}
 */
export const deleteVehicleRepairPart = async (vehicleId, repairPartId, identifyingProps = {}) => {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
      throw new Error("Vehicle document not found for deletion.");
    }

    const currentRepairParts = vehicleSnap.data().repairParts || [];
    let partIndexToDelete = -1;

    // 嘗試根據 ID 找到項目
    if (repairPartId) {
      partIndexToDelete = currentRepairParts.findIndex(part => part.id === repairPartId);
    }

    // 如果沒有找到 ID 或 ID 不存在 (舊資料情況)，則嘗試根據 item 和 cost 找到項目
    if (partIndexToDelete === -1 && identifyingProps.item && identifyingProps.cost !== undefined) {
      partIndexToDelete = currentRepairParts.findIndex(part => 
        part.part === identifyingProps.item && parseFloat(part.cost) === parseFloat(identifyingProps.cost)
      );
    }

    if (partIndexToDelete === -1) {
      throw new Error("Repair part not found in vehicle's repairParts array for deletion.");
    }

    const updatedRepairParts = currentRepairParts.filter((_, index) => index !== partIndexToDelete);

    await updateDoc(vehicleRef, {
      repairParts: updatedRepairParts
    });

    console.log(`刪除維修部件成功，ID: ${repairPartId || identifyingProps.item}`);
  } catch (error) {
    console.error("刪除車輛維修部件時出錯:", error);
    throw error;
  }
};

/**
 * 計算車輛維修部件總費用
 * @param {string} vehicleId - 車輛ID
 * @param {string} status - 可選的狀態篩選 (pending/done)
 * @returns {Promise<Object>} 費用統計
 */
export const calculateVehicleRepairCosts = async (vehicleId, status = null) => {
  try {
    // 這個函數會呼叫 getVehicleRepairParts，所以它應該會自動處理陣列獲取邏輯
    const repairParts = await getVehicleRepairParts(vehicleId, status);
    
    const costs = repairParts.reduce((acc, part) => {
      const cost = parseFloat(part.cost) || 0;
      
      if (part.status === "done") {
        acc.paidCost += cost;
      } else if (part.status === "pending") {
        acc.unpaidCost += cost;
      }
      
      acc.totalCost += cost;
      return acc;
    }, {
      paidCost: 0,
      unpaidCost: 0,
      totalCost: 0,
      partCount: repairParts.length
    });
    
    return costs;
  } catch (error) {
    console.error("計算車輛維修費用時出錯:", error);
    throw error;
  }
};

/**
 * 上傳發票/照片到 Storage，回傳下載連結
 * @param {File} file - 檔案物件
 * @param {string} vehicleId - 車輛ID
 * @param {string} repairPartId - 維修部件ID（可選）
 * @returns {Promise<string>} 下載連結
 */
export const uploadRepairInvoiceFile = async (file, vehicleId, repairPartId = null) => {
  try {
    const storage = getStorage();
    const fileName = repairPartId 
      ? `vehicles/${vehicleId}/repairs/${repairPartId}/${Date.now()}_${file.name}`
      : `vehicles/${vehicleId}/repairs/${Date.now()}_${file.name}`;
    
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log(`上傳發票檔案成功: ${fileName}`);
    return downloadURL;
  } catch (error) {
    console.error("上傳發票檔案時出錯:", error);
    throw error;
  }
};

/**
 * 遷移舊的 repairs collection 資料到新的車輛子集合結構
 * 這是一個遷移函數，僅在資料遷移時使用
 * @returns {Promise<Object>} 遷移結果統計
 */
export const migrateRepairsToVehicleSubcollection = async () => {
  try {
    console.log("開始遷移維修資料到車輛子集合...");
    
    // 取得所有舊的維修記錄
    const repairsRef = collection(db, "repairs");
    const repairsSnapshot = await getDocs(repairsRef);
    
    const stats = {
      total: repairsSnapshot.docs.length,
      migrated: 0,
      failed: 0,
      errors: []
    };
    
    for (const repairDoc of repairsSnapshot.docs) {
      const repairData = repairDoc.data();
      const repairId = repairDoc.id;
      
      try {
        // 檢查是否有 vehicleId
        if (!repairData.vehicleId) {
          console.warn(`維修記錄 ${repairId} 缺少 vehicleId，跳過`);
          stats.failed++;
          stats.errors.push(`${repairId}: 缺少 vehicleId`);
          continue;
        }
        
        // 轉換資料格式
        const newRepairData = {
          item: repairData.item || "",
          location: repairData.location || "",
          date: repairData.date || "",
          partNumber: repairData.partNumber || "",
          cost: repairData.cost || 0,
          status: repairData.status || "pending",
          invoiceUrl: repairData.invoiceUrl || "",
          userId: repairData.userId || "",
          // 保留原始時間戳記
          createdAt: repairData.createdAt || Timestamp.now(),
          updatedAt: repairData.updatedAt || Timestamp.now(),
          // 記錄遷移資訊
          migratedFrom: repairId,
          migratedAt: Timestamp.now()
        };
        
        // 新增到車輛子集合
        await addVehicleRepairPart(repairData.vehicleId, newRepairData);
        stats.migrated++;
        
        console.log(`遷移維修記錄 ${repairId} 到車輛 ${repairData.vehicleId} 成功`);
        
      } catch (error) {
        console.error(`遷移維修記錄 ${repairId} 時出錯:`, error);
        stats.failed++;
        stats.errors.push(`${repairId}: ${error.message}`);
      }
    }
    
    console.log("維修資料遷移完成:", stats);
    return stats;
    
  } catch (error) {
    console.error("遷移維修資料時出錯:", error);
    throw error;
  }
};
