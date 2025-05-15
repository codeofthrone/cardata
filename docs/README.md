# Firestore 數據結構設計文檔

## 品牌、車型與CC數值的關聯設計

本文檔詳細說明了如何在Firestore中設計和實現品牌、車型與CC數值之間的關聯數據結構。

### 設計目標

1. 建立清晰的品牌→車型→CC數值層級關係
2. 支持連動下拉選單的需求
3. 優化查詢效率，減少多次查詢
4. 確保數據一致性和擴展性

### 數據結構概覽

我們採用了三層集合結構：

```
- brands/ (品牌集合)
- models/ (車型集合)
- cc_values/ (CC數值集合)
```

這種設計使得數據關係清晰，並通過冗餘存儲關鍵字段來提高查詢效率。

## 詳細設計文檔

- [Firestore 車型與CC數值關聯數據設計](./firestore-model-cc-design.md) - 詳細的數據結構設計和實現方案

## 實現工具

我們提供了一套完整的工具函數來操作Firestore中的品牌、車型和CC數值數據：

- `src/utils/firestoreModelCC.js` - 包含所有數據操作函數

## 使用示例

```javascript
// 獲取品牌列表
const brands = await fetchBrands();

// 獲取特定品牌的車型
const models = await fetchModelsByBrand(brandId);

// 獲取特定車型的CC數值
const ccValues = await fetchCCValuesByModel(modelId);

// 添加新的CC數值
await addCCValue({
  value: 2000,  // CC數值
  modelId: "model123"  // 車型ID
});
```

## 數據遷移

如果需要從舊的數據結構遷移到新的數據結構，可以使用我們提供的遷移工具：

```javascript
import { migrateDataToNewStructure } from "../utils/firestoreModelCC";

// 執行數據遷移
await migrateDataToNewStructure();
```

## 相關文件

- [firestoreModelCC.js](../src/utils/firestoreModelCC.js) - 數據操作工具函數
- [firestore-model-cc-design.md](./firestore-model-cc-design.md) - 詳細設計文檔