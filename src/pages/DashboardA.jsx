import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc } from "firebase/firestore";

export default function DashboardA() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCC, setSelectedCC] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [equipment, setEquipment] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [deposit, setDeposit] = useState("");
  const [notes, setNotes] = useState("");

  // 顏色選項
  const colorOptions = ["黑色", "白色", "銀色", "紅色", "藍色", "灰色", "其他"];
  
  // 車型選項
  const typeOptions = ["轎車", "休旅車", "跑車", "商用車", "其他"];

  // 生成年份選項 (從當前年份往前推30年)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 31 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    const fetchBrands = async () => {
      try {
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
    setSelectedCC(""); // 重置CC
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setSelectedCC(""); // 重置CC
  };

  // 找到目前選到的品牌對應的車型
  const currentModels = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)?.models || [];
  
  // 找到目前選到的車型對應的CC數
  const currentCCs = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)
    ?.models?.find(m => m.name === selectedModel)?.ccs || [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">新增車輛資訊</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 品牌選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="brandInput">品牌</label>
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

        {/* 車型選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="modelInput">車型</label>
          <input
            id="modelInput"
            className="border p-2 w-full"
            list="modelOptions"
            value={selectedModel}
            onChange={handleModelChange}
            placeholder="請選擇或輸入車型"
            disabled={!selectedBrand}
          />
          <datalist id="modelOptions">
            {currentModels.map((model, index) => (
              <option key={index} value={model}>
                {model}
              </option>
            ))}
          </datalist>
        </div>

        {/* CC數選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="ccInput">CC數</label>
          <input
            id="ccInput"
            className="border p-2 w-full"
            list="ccOptions"
            value={selectedCC}
            onChange={(e) => setSelectedCC(e.target.value)}
            placeholder="請選擇或輸入CC數"
            disabled={!selectedModel}
          />
          <datalist id="ccOptions">
            {currentCCs.map((cc, index) => (
              <option key={index} value={cc}>
                {cc}
              </option>
            ))}
          </datalist>
        </div>

        {/* 年份選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="yearInput">年份</label>
          <input
            id="yearInput"
            className="border p-2 w-full"
            list="yearOptions"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            placeholder="請選擇或輸入年份"
          />
          <datalist id="yearOptions">
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </datalist>
        </div>

        {/* 顏色選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="colorInput">顏色</label>
          <input
            id="colorInput"
            className="border p-2 w-full"
            list="colorOptions"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            placeholder="請選擇或輸入顏色"
          />
          <datalist id="colorOptions">
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </datalist>
        </div>

        {/* 車型類別選擇 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="typeInput">車型類別</label>
          <input
            id="typeInput"
            className="border p-2 w-full"
            list="typeOptions"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            placeholder="請選擇或輸入車型類別"
          />
          <datalist id="typeOptions">
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </datalist>
        </div>

        {/* 車牌號碼 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="plateNumber">車牌號碼</label>
          <input
            id="plateNumber"
            type="text"
            className="border p-2 w-full"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="請輸入車牌號碼"
          />
        </div>

        {/* 配備 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="equipment">配備</label>
          <input
            id="equipment"
            type="text"
            className="border p-2 w-full"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="請輸入配備"
          />
        </div>

        {/* 類別 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="category">類別</label>
          <input
            id="category"
            type="text"
            className="border p-2 w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="請輸入類別"
          />
        </div>

        {/* 置處 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="location">置處</label>
          <input
            id="location"
            type="text"
            className="border p-2 w-full"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="請輸入置處"
          />
        </div>

        {/* 收訂 */}
        <div className="mb-4">
          <label className="block mb-1" htmlFor="deposit">收訂</label>
          <input
            id="deposit"
            type="text"
            className="border p-2 w-full"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="請輸入收訂金額"
          />
        </div>

        {/* 備注 */}
        <div className="mb-4 col-span-2">
          <label className="block mb-1" htmlFor="notes">備注</label>
          <textarea
            id="notes"
            className="border p-2 w-full"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="請輸入備注"
            rows="3"
          />
        </div>
      </div>
    </div>
  );
}