# src 資料夾

此資料夾包含應用程序的源代碼，包括主要的React組件和配置文件。

## 文件列表

- **App.jsx**: 主應用程序組件。
- **firebase.js**: Firebase配置文件。
- **index.css**: 全局樣式文件。
- **main.jsx**: 應用程序入口點。
- **pages/**: 包含不同頁面的React組件。
  - **DashboardA.jsx**: 儀表板A頁面（入庫管理模組）。
  - **DashboardB.jsx**: 儀表板B頁面（維修與花費管理模組）。
  - **DashboardC.jsx**: 儀表板C頁面（車輛總覽與篩選模組）。
  - **Login.jsx**: 登錄頁面。
  - **VehicleList.jsx**: 車輛列表頁面。
- **components/**: 可重用組件。
  - **ModelCCSelector.jsx**: 品牌、車型和CC值連動選擇器組件。
- **utils/**: 工具函數。
  - **firestoreModelCC.js**: Firestore數據操作工具函數。

## 已完成功能

- ✅ 基本UI框架搭建（使用React、TailwindCSS和Material UI）
- ✅ Firebase身份驗證整合
- ✅ Firestore數據庫連接
- ✅ 品牌、車型和CC數值的層級關係管理
- ✅ 連動下拉選單（品牌→車型→CC）
- ✅ 自動保存新選項到Firestore
- ✅ 車輛信息CRUD操作
- ✅ 儀表板頁面開發
- ✅ PWA配置（可在手機和電腦上使用）

## Firestore讀取優化方案

為解決Firestore大量讀取問題（24萬次讀取），建議實施以下優化方案：

### 1. 實施客戶端緩存

```javascript
// 使用React Query進行數據緩存示例
import { useQuery, QueryClient, QueryClientProvider } from 'react-query';
import { fetchBrands } from '../utils/firestoreModelCC';

// 在組件中使用
const { data: brands, isLoading } = useQuery('brands', fetchBrands, {
  staleTime: 1000 * 60 * 5, // 5分鐘內不重新獲取數據
  cacheTime: 1000 * 60 * 30, // 緩存30分鐘
});
```

### 2. 批量讀取優化

```javascript
// 批量獲取數據示例
const fetchModelAndCCData = async (brandId) => {
  // 一次性獲取所有相關數據
  const modelsRef = collection(db, "models");
  const ccValuesRef = collection(db, "cc_values");
  
  const [modelsSnapshot, ccValuesSnapshot] = await Promise.all([
    getDocs(query(modelsRef, where("brandId", "==", brandId))),
    getDocs(query(ccValuesRef, where("brandId", "==", brandId)))
  ]);
  
  // 處理數據...
  return { models: modelsData, ccValues: ccValuesData };
};
```

### 3. 啟用離線持久化

```javascript
// 在firebase.js中啟用離線持久化
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 啟用離線持久化
enableIndexedDbPersistence(db)
  .catch((err) => {
    console.error("離線持久化啟用失敗:", err);
  });

export { db };
```

### 4. 使用本地存儲緩存

```javascript
// 使用localStorage緩存常用數據
const getCachedBrands = async () => {
  // 檢查本地緩存
  const cachedData = localStorage.getItem('brands');
  const cacheTime = localStorage.getItem('brands_cache_time');
  
  // 如果緩存存在且未過期（1小時內）
  if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
    return JSON.parse(cachedData);
  }
  
  // 否則從Firestore獲取
  const brandsData = await fetchBrands();
  
  // 更新緩存
  localStorage.setItem('brands', JSON.stringify(brandsData));
  localStorage.setItem('brands_cache_time', Date.now().toString());
  
  return brandsData;
};
```

### 5. 減少實時監聽器

```javascript
// 替換實時監聽為按需查詢
// 不推薦的方式（持續監聽）:
const unsubscribe = onSnapshot(collection(db, "brands"), (snapshot) => {
  // 處理數據變化...
});

// 推薦的方式（按需查詢）:
const loadBrandsData = async () => {
  const snapshot = await getDocs(collection(db, "brands"));
  // 處理數據...
};
```