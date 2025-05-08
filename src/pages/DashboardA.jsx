import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc } from "firebase/firestore";

export default function DashboardA() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        // 使用正確的方式獲取子集合
        const settingsRef = doc(db, "settings", "brands");
        const modelsCollection = collection(settingsRef, "models");
        const snapshot = await getDocs(modelsCollection);
        
        const brandData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBrands(brandData);
      } catch (error) {
        console.error("Error fetching brands:", error);
        // 如果第一種方式失敗，嘗試直接從 brands 集合讀取
        try {
          const snapshot = await getDocs(collection(db, "brands"));
          const brandData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBrands(brandData);
        } catch (err) {
          console.error("Failed to fetch brands from alternate path:", err);
          setBrands([]);
        }
      }
    };
    
    fetchBrands();
  }, []);

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    setSelectedModel(""); // 重置車型
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  // 找到目前選到的品牌對應的車型
  const currentModels = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)?.models || [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">新增車輛資訊</h2>

      {/* 品牌下拉 - 使用 input + datalist */}
      <div className="mb-4">
        <label className="block mb-1" htmlFor="brandInput">選擇品牌</label>
        <input
          id="brandInput"
          className="border p-2 w-full"
          list="brandOptions"
          value={selectedBrand}
          onChange={handleBrandChange}
          placeholder="請選擇或輸入品牌"
        />
        <datalist id="brandOptions">
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </datalist>
      </div>

      {/* 車型下拉 - 使用 input + datalist */}
      <div className="mb-4">
        <label className="block mb-1" htmlFor="modelInput">選擇車型</label>
        <input
          id="modelInput"
          className="border p-2 w-full"
          list="modelOptions"
          value={selectedModel}
          onChange={handleModelChange}
          placeholder="請選擇或輸入車型"
          disabled={!selectedBrand} // 如果沒有選擇品牌就禁用
        />
        <datalist id="modelOptions">
          {currentModels.map((model, index) => (
            <option key={index} value={model}>
              {model}
            </option>
          ))}
        </datalist>
      </div>

      {/* 顯示選擇結果 */}
      <div className="mt-6">
        <div>選擇的品牌：{selectedBrand}</div>
        <div>選擇的車型：{selectedModel}</div>
      </div>
    </div>
  );
}