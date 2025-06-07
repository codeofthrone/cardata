# Firebase Vehicle Information System

## 項目概述

這是一個基於Firebase的車輛信息管理系統，使用React、TailwindCSS和Material UI構建，支持PWA功能，可在手機和電腦上使用。

## 功能
1. **車輛入庫管理模組（權限A）**
   - 新增車輛資料
   - 記錄入庫日期與來源
   - 執行入庫檢查步驟（可自定義檢查清單）
   - 更新車輛狀態（在庫／已售等）
   - 車輛資訊欄位：廠牌、車型、車牌、年份、顏色、CC、配備、類別、位置、收訂日期、備註

2. **維修與花費管理模組（權限B）**
   - 顯示當前登入用戶所屬公司的車輛列表
   - 提供車輛搜尋功能 (依車牌、品牌、型號)
   - 提供車輛篩選功能 (依狀態、品牌、型號)
   - 為特定車輛新增維修紀錄（使用車輛文檔內的 `repairParts` 陣列）
   - 維修項目、地點、時間、料號、費用
   - 可上傳維修發票或照片（存入 Firebase Storage，使用車輛特定路徑）
   - 顯示每台車輛的維修項目數及相關費用 (已付款、未付款、總金額)
   - **車牌點擊功能**：點擊車牌彈出維修清單模態框，支援付款狀態切換
   - 自動彙總各車輛總花費（從維修記錄陣列計算）
   - 支援維修狀態即時更新（待處理 ↔ 已完成）
   - 即時更新維修進度和費用統計

3. **車輛總覽與篩選模組（權限C）**
   - 顯示所有車輛清單（支援分頁）
   - Filter 選項：廠牌、車型、年份、顏色、價格區間、在庫狀態等
   - 關鍵字搜尋：車牌或備註欄
   - 點選可進入詳細頁（含入庫與維修資訊）

## 技術棧
- **前端**：React with Vite
- **樣式**：TailwindCSS
- **後端**：Firebase（身份驗證，Firestore）
- **部署**：Firebase Hosting

## 項目結構
```
├── src/                  # 源代碼
│   ├── pages/            # 不同頁面的React組件
│   │   ├── DashboardA.jsx  # 入庫管理介面
│   │   ├── DashboardB.jsx  # 維修管理介面
│   │   ├── DashboardC.jsx  # 車輛總覽介面
│   │   ├── Login.jsx       # 登入頁面
│   │   └── VehicleList.jsx # 車輛列表組件
│   ├── components/       # 可重用組件
│   ├── utils/            # 工具函數
│   │   ├── firestoreVehicleRepairs.js # 車輛維修子集合操作（備用架構）
│   │   ├── firestoreRepairs.js        # 舊維修系統（已棄用）
│   │   ├── firebaseStorage.js         # 檔案上傳工具
│   │   └── firestoreModelCC.js        # 車型/CC資料處理
│   ├── contexts/         # React Context
│   │   └── AuthContext.jsx  # 身份驗證上下文
│   ├── App.jsx           # 主應用程序組件
│   ├── firebase.js       # Firebase配置
│   ├── index.css         # 全局樣式
│   └── main.jsx          # 應用程序入口點
├── scripts/              # 工具腳本
│   └── migrate-repairs-to-subcollection.js # 資料遷移腳本
```
## 檔案執行流程

1. **程式入口點**：
   - [main.jsx](src/main.jsx) - 應用程序入口點，初始化React應用並註冊Service Worker
   - [App.jsx](src/App.jsx) - 主應用元件，設置路由並包含[AuthProvider](src/contexts/AuthContext.jsx)

2. **核心模組**：
   - [AuthContext.jsx](src/contexts/AuthContext.jsx) - 認證上下文，管理用戶登入狀態和權限
   - [firebase.js](src/firebase.js) - Firebase服務初始化和配置

3. **頁面元件**：
   - [Login.jsx](src/pages/Login.jsx) - 登入頁面
   - [DashboardA.jsx](src/pages/DashboardA.jsx) - 入庫管理模組 (A權限)
   - [DashboardB.jsx](src/pages/DashboardB.jsx) - 維修管理模組 (B權限)
   - [DashboardC.jsx](src/pages/DashboardC.jsx) - 車輛總覽模組 (C權限)

4. **工具和組件**：
   - [firestoreModelCC.js](src/utils/firestoreModelCC.js) - 處理品牌、車型和CC數值的Firestore操作

## 使用者登入流程

1. **登入過程**：
   - 用戶進入應用後，[AuthContext](src/contexts/AuthContext.jsx)檢查登入狀態
   - 未登入用戶被導向[登入頁面](src/pages/Login.jsx)
   - 用戶輸入郵箱和密碼，點擊登入按鈕
   - `Login.jsx`執行`handleSubmit`函數，調用`AuthContext`的`login`方法

2. **認證處理**：
   - `AuthContext.jsx`中的`login`函數使用Firebase Authentication驗證用戶
   - 登入成功後，`onAuthStateChanged`監聽器被觸發
   - 系統透過`fetchUserByEmail`函數檢查用戶在Firestore的文檔

3. **用戶數據處理**：
   - 如用戶文檔存在：加載用戶角色和公司信息
   - 如用戶文檔不存在：創建新用戶記錄，設置默認權限 (通常為C權限)
   - 用戶信息被存儲在`currentUser`狀態中，可通過`useAuth`鉤子在整個應用中訪問

4. **權限路由**：
   - 登入成功後，用戶被導航到首頁
   - [App.jsx](src/App.jsx)根據用戶角色顯示對應界面切換選項(A、B或C)
   - 用戶可點擊界面按鈕切換不同模組，或使用`logout`功能登出

### 用戶角色與權限
- **A權限**：入庫管理模組，可新增和編輯車輛資料
- **B權限**：維修管理模組，可記錄維修項目、費用和上傳發票
- **C權限**：車輛總覽模組，查看所有車輛信息和篩選功能

### 測試帳號
| 角色 | 電子郵件 | 密碼 |
|------|----------|------|
| A權限 | a062977sweet+1@gmail.com | 123456 |
| B權限 | a062977sweet+2@gmail.com | 123456 |
| C權限 | a062977sweet+2@gmail.com | 123456 |



## Firebase 資料結構

### 當前實作架構

**維修資料儲存方式**：系統採用車輛文檔內的 `repairParts` 陣列來儲存維修記錄，而非使用子集合架構。

**設計優勢**：
- **簡化權限控制**：避免子集合路徑的複雜安全規則
- **提升查詢效能**：單次讀取獲得車輛和維修資料
- **確保資料一致性**：維修記錄直接隸屬於車輛文檔
- **簡化前端邏輯**：統一資料來源和處理邏輯

### Collections

1. **vehicles**
   - 儲存所有車輛基本資訊和維修記錄
   - 基本欄位：brand, model, plateNumber, year, color, cc, equipment, category, location, deposit, notes, status, createdAt, updatedAt, company
   - **repairParts** (Array)：維修記錄陣列
     - `part`: 維修部位
     - `cost`: 金額
     - `status`: 維修狀態 ("pending", "done")
     - `date`: 維修日期
     - `location`: 維修地點
     - `partNumber`: 料號
     - `invoiceUrl`: 發票/照片URL
     - `userId`: 操作用戶ID
     - `createdAt`: 記錄建立時間
     - `updatedAt`: 記錄更新時間

2. **repairs** (已棄用)
   - 舊的維修記錄集合，已遷移至車輛文檔的 repairParts 陣列

3. **settings/brands/models**
   - 儲存品牌和車型資料
   - 結構：
     ```
     settings/
       brands/
         models/
           {brandId}/
             model_list/
               {modelId}/
                 ccs: [cc1, cc2, ...]
     ```

4. **settings/options**
   - 儲存系統選項設定
   - 欄位：colors, types, years

## 設置說明

### 安裝
1. 克隆存儲庫
   ```bash
   git clone <repository-url>
   cd cardata
   ```

2. 安裝依賴項
   ```bash
   npm install
   ```

3. 在根目錄創建一個`.env`文件，並填入您的Firebase配置：
   ```
   VITE_API_KEY=your-api-key
   VITE_AUTH_DOMAIN=your-auth-domain
   VITE_PROJECT_ID=your-project-id
   VITE_STORAGE_BUCKET=your-storage-bucket
   VITE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_APP_ID=your-app-id
   ```

### 運行應用程序

#### 開發模式
```bash
npm run dev
```
這將在http://localhost:5173啟動開發服務器

#### 生產構建
```bash
npm run build
```

#### 預覽生產構建
```bash
npm run preview
```

## 資料架構說明

### 當前維修資料儲存方式

**實作策略**：採用車輛文檔內的 `repairParts` 陣列儲存維修記錄

**架構優勢**：
- **簡化權限控制**：避免子集合路徑的複雜安全規則設定
- **提升查詢效能**：單次讀取即可獲得車輛和維修資料
- **確保資料一致性**：維修記錄直接隸屬於車輛文檔
- **簡化前端邏輯**：統一資料來源，減少同步問題

### 功能特色

**DashboardB 車牌點擊功能**：
- 點擊車牌號碼彈出維修清單模態框
- 即時顯示維修項目、金額和付款狀態
- 支援一鍵切換付款狀態（pending ↔ done）
- 自動計算已付款、未付款和總金額統計

### 資料結構彈性設計

**當前實作**：陣列結構（`vehicle.repairParts`）
**備用方案**：子集合結構（已完成開發，可在需要時切換）
**遷移工具**：已完成子集合遷移腳本，保留作為未來擴展選項

### 開發工具腳本

#### 測試車輛維修功能
```bash
node scripts/test-vehicle-repairs.js
```

#### 資料遷移（備用）
如需切換至子集合架構：

**檢查遷移狀態**
```bash
node scripts/migrate-repairs-to-subcollection.js --check
```

**執行資料遷移**
```bash
node scripts/migrate-repairs-to-subcollection.js --migrate
```

## 部署

該應用程序配置為部署到Firebase Hosting：

```bash
npm run build
firebase deploy
```

## 許可證

此項目根據MIT許可證授權 - 請參閱LICENSE文件以獲取詳細信息。