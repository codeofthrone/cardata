import { db } from "../firebase";
import { collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * 維修紀錄資料結構
 * @typedef {Object} RepairRecord
 * @property {string} vehicleId - 車輛ID
 * @property {string} item - 維修項目
 * @property {string} location - 維修地點
 * @property {string} date - 維修日期
 * @property {string} partNumber - 料號
 * @property {number} cost - 費用
 * @property {string} status - 狀態 (pending/done)
 * @property {string} [invoiceUrl] - Google Drive 發票/照片連結
 * @property {Date} createdAt - 建立時間
 */

// 新增維修紀錄
export const addRepair = async (repairData) => {
  const repairsRef = collection(db, "repairs");
  const docRef = await addDoc(repairsRef, {
    ...repairData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// 取得所有維修紀錄（可選 vehicleId 過濾）
export const getRepairs = async (vehicleId = null) => {
  let q = collection(db, "repairs");
  if (vehicleId) {
    q = query(q, where("vehicleId", "==", vehicleId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 更新維修狀態
export const updateRepairStatus = async (repairId, status) => {
  const repairRef = doc(db, "repairs", repairId);
  await updateDoc(repairRef, { status });
};

// 上傳發票/照片到 Storage，回傳下載連結
export const uploadInvoiceFile = async (file) => {
  const storage = getStorage();
  const storageRef = ref(storage, `invoices/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}; 