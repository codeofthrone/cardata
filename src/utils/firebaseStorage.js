import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// 上傳檔案到 Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // 建立檔案中繼資料
    const metadata = {
      contentType: file.type,
    };

    // 上傳檔案
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    // 回傳 Promise 以監控上傳進度
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // 計算上傳進度
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("上傳進度: " + progress + "%");
        },
        (error) => {
          // 處理錯誤
          console.error("上傳失敗:", error);
          reject(error);
        },
        async () => {
          // 上傳完成，取得下載 URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("上傳檔案時發生錯誤:", error);
    throw error;
  }
};

// 從 Firebase Storage 取得檔案 URL
export const getFileUrl = async (path) => {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error("取得檔案 URL 時發生錯誤:", error);
    throw error;
  }
}; 