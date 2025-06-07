# 任務清單 (todo.md)

## 已完成任務 ✅

### Firebase 資料結構調整 (2025年6月7日)
*   [x] **建立新的車輛維修子集合工具函數** (`/src/utils/firestoreVehicleRepairs.js`)
*   [x] **更新 DashboardB.jsx** 使用新的維修子集合結構
*   [x] **更新 DashboardA.jsx** 維修資料保存邏輯
*   [x] **建立資料遷移腳本** (`/scripts/migrate-repairs-to-subcollection.js`)
*   [x] **更新函數調用** 傳遞必要的 vehicleId 參數
*   [x] **檔案上傳路徑優化** 使用車輛特定的儲存路徑

### 車輛列表功能對齊 (2025年6月1日)
*   [x] **DashboardB.jsx 車輛列表與篩選功能對齊 DashboardC.jsx**

## 當前優先任務 🚧

### 資料遷移與測試
*   [x] **執行資料遷移**:
     ```bash
     # 檢查遷移狀態
     node scripts/migrate-repairs-to-subcollection.js --check
     
     # 執行遷移
     node scripts/migrate-repairs-to-subcollection.js --migrate
     ```
     ✅ 成功遷移 1 筆維修記錄到新的車輛子集合結構
*   [x] **功能測試**: 
     - [x] 遷移腳本功能驗證
     - [x] 新資料結構驗證
     - [x] 前端車牌點擊付款狀態切換功能開發
     - [x] **DashboardB.jsx 車牌點擊功能修正**: 修正維修項目顯示、金額計算與列表顯示錯誤
     - [x] **DashboardB.jsx 資料結構不匹配問題修正**: 修正 getAllVehicleRepairParts 函數回傳的資料結構與前端使用不一致的問題
     - [x] **DashboardB.jsx 車牌點擊功能問題最終解決**: 採用陣列結構回退策略，成功解決所有顯示和功能問題
     - [x] 前端查詢維修記錄功能測試  
     - [x] 前端更新維修狀態功能測試
     - [x] 計算維修費用功能測試
     - [x] 前端新增維修記錄功能測試
     - [ ] 檔案上傳功能測試

### 清理與優化
*   [ ] **移除舊的 firestoreRepairs.js 檔案** (確認新系統穩定後)
*   [ ] **清理舊的 repairs collection** (確認遷移成功後)
*   [ ] **效能測試與優化**

## 規格與文件

*   [x] **spec.md**: 更新維修系統架構說明，反映新的陣列結構實作方式
*   [ ] **spec.md**: 針對 `DashboardA.jsx` 和 `VehicleList.jsx` 補充詳細功能描述
*   [ ] **spec.md**: (可選) 使用專業工具產生並嵌入UML圖的圖片版本，以替代或補充 Mermaid 圖
*   [x] **report.md**: 記錄 DashboardB 車牌點擊功能問題解決過程和最終實作方式
*   [x] **README.md**: 更新專案描述以反映當前資料架構和功能實作狀況
*   [x] **todo.md**: 更新任務進度，標記已完成項目

## 開發任務

### 功能完善與新增
*   [ ] **DashboardA**: 根據 `spec.md` 中定義 (或待定義) 的功能進行開發或完善
*   [ ] **VehicleList**: 根據 `spec.md` 中定義 (或待定義) 的功能進行開發或完善
*   [ ] **錯誤處理**: 全面審查應用程式中的錯誤處理機制，確保提供清晰的用戶反饋
*   [ ] **用戶反饋**: 在耗時操作 (如數據提交、文件上傳) 時提供更明確的加載/等待提示
*   [ ] **DataConnect**: 評估並整合 `dataconnect/` 目錄下的 GraphQL 功能。若適用，考慮使用其替換部分 Firestore 的直接調用邏輯，以提升數據查詢的靈活性和效率
*   [ ] **國際化 (i18n)**: 考慮為應用程式添加多語言支持的基礎架構

### 測試
*   [ ] **單元測試**: 為 `src/utils/` 下的工具函數編寫單元測試 (包括新的 `firestoreVehicleRepairs.js`)
*   [ ] **組件測試**: 為核心組件 (e.g., `DashboardB`, `DashboardC`, `Login`) 編寫組件測試，驗證其渲染和基本交互
*   [ ] **整合測試**: 測試用戶認證流程、儀表板數據交互 (如篩選、新增記錄) 等關鍵用戶流程。

### 重構與優化
*   [ ] **代碼重複**: 檢查 `DashboardB.jsx` 和 `DashboardC.jsx` 之間是否有可重用的 UI 組件或業務邏輯，進行提取和重構以提高代碼可維護性。
*   [ ] **性能優化**: 針對 Firestore 查詢進行評估，確保已配置適當的索引，減少不必要的數據讀取，特別是在列表展示和篩選功能上。
*   [ ] **狀態管理**: 評估當前 `useState` 和 `AuthContext` 的使用。對於更複雜的跨組件狀態或全局狀態，考慮是否引入如 Zustand 或 Redux Toolkit 等更專業的狀態管理庫。

### Firebase
*   [ ] **Firestore 安全規則**: 仔細審查和強化 `firestore.rules`，確保數據訪問的安全性，遵循最小權限原則。
*   [ ] **Firebase Storage 安全規則**: 審查 Firebase Storage 的安全規則，確保文件上傳和訪問的安全性。

## 已完成 (參考 `report.md`)
*   [x] **DashboardB**: 車輛列表顯示與篩選邏輯已與 `DashboardC` 對齊，並確保了公司特定數據的正確過濾和顯示。
