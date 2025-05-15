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
   - 為特定車輛新增維修紀錄
   - 維修項目、地點、時間、料號、費用
   - 可上傳維修發票或照片（存入 Firebase Storage）
   - 自動彙總各車輛總花費

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
│   │   ├── DashboardA.jsx
│   │   ├── DashboardB.jsx
│   │   ├── DashboardC.jsx
│   │   ├── Login.jsx
│   │   └── VehicleList.jsx
│   ├── components/       # 可重用組件
│   │   └── ModelCCSelector.jsx
│   ├── utils/            # 工具函數
│   │   └── firestoreModelCC.js
│   ├── App.jsx           # 主應用程序組件
│   ├── firebase.js       # Firebase配置
│   ├── index.css         # 全局樣式
│   └── main.jsx          # 應用程序入口點
├── dataconnect/          # Firebase DataConnect配置
├── docs/                 # 項目文檔
│   └── firestore-model-cc-design.md
├── scripts/              # 腳本工具
│   └── migrate-model-cc-data.js
├── firebaseconfig.js     # Firebase配置（替代）
├── upload_to_firestore.js # 數據上傳工具
├── kingautos_results.json # 上傳的源數據
└── firebase.json         # Firebase配置文件
```

## 設置說明

### 先決條件
-登入 Dashboard 帳號密碼：
DashboardA: #入庫模組
- 帳號：a062977sweet+1@gmail.com
- 密碼：123456
DashboardB: #維修模組
- 帳號：a062977sweet+2@gmail.com
- 密碼：123456
DashboardC: #車輛總覽模組
- 帳號：a062977sweet+2@gmail.com
- 密碼：123456

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

4. 對於數據上傳工具，下載您的Firebase服務帳戶密鑰，並將其保存為`cardata-17759-firebase-adminsdk.json`在項目根目錄中。

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

## 數據上傳工具

該項目包括一個用於將車輛數據從JSON文件上傳到Firestore的工具腳本：

1. 確保您在項目根目錄中擁有服務帳戶密鑰文件（`cardata-17759-firebase-adminsdk.json`）
2. 在`kingautos_results.json`文件中準備您的數據
3. 運行上傳腳本：
   ```bash
   node upload_to_firestore.js
   ```

該腳本將品牌和型號信息上傳到Firestore集合。

## Firebase集合

應用程序使用以下Firestore集合：

- **users**：用戶信息，包括角色
- **vehicles**：車輛信息（品牌，型號，車牌號）
- **brands**：車輛品牌
- **models**：車輛型號
- **settings**：應用程序設置

## 部署

該應用程序配置為部署到Firebase Hosting：

```bash
npm run build
firebase deploy
```

## 許可證

此項目根據MIT許可證授權 - 請參閱LICENSE文件以獲取詳細信息。