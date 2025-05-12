import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc } from "firebase/firestore";
import { Helmet } from "react-helmet";
// If Helmet is not installed, you can add it with: npm install react-helmet

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
        // First try to fetch the brands collection
        const brandsSnapshot = await getDocs(collection(db, "settings", "brands", "models"));
        
        if (!brandsSnapshot.empty) {
          const brandData = brandsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.id, // Use document ID as name
            ...doc.data()
          }));
          setBrands(brandData);
          console.log("Brands fetched successfully:", brandData);
        } else {
          // If no brands found, try alternate approach
          console.log("No brands found in settings/brands/models, trying alternate path");
          throw new Error("No brands found in primary path");
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        try {
          // Try to fetch from direct brands collection as fallback
          const snapshot = await getDocs(collection(db, "brands"));
          const brandData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.id,
            ...doc.data()
          }));
          setBrands(brandData);
          console.log("Brands fetched from alternate path:", brandData);
        } catch (err) {
          console.error("Failed to fetch brands from alternate path:", err);
          setBrands([]);
        }
      }
    };
    
    fetchBrands();
  }, []);

  // Fetch models for selected brand
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrand) return;
      
      try {
        const modelsSnapshot = await getDocs(collection(db, "settings", "brands", "models", selectedBrand, "model_list"));
        
        if (!modelsSnapshot.empty) {
          const modelData = modelsSnapshot.docs.map(doc => doc.id);
          const selectedBrandData = {...brands.find(b => b.id === selectedBrand)};
          selectedBrandData.models = modelData;
          
          // Update the brands array with the new model data
          setBrands(prev => prev.map(brand => 
            brand.id === selectedBrand ? selectedBrandData : brand
          ));
          
          console.log(`Models for ${selectedBrand} fetched:`, modelData);
        }
      } catch (error) {
        console.error(`Error fetching models for ${selectedBrand}:`, error);
      }
    };
    
    fetchModels();
  }, [selectedBrand]);

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
    <div className="p-4 max-w-4xl mx-auto">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>新增車輛資訊</title>
      </Helmet>
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">新增車輛資訊</h2>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-TW')}</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 品牌選擇 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="brandInput">品牌</label>
          <input
            id="brandInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          <label className="block mb-1 font-medium" htmlFor="modelInput">車型</label>
          <input
            id="modelInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
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
          <label className="block mb-1 font-medium" htmlFor="ccInput">CC數</label>
          <input
            id="ccInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
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
          <label className="block mb-1 font-medium" htmlFor="yearInput">年份</label>
          <input
            id="yearInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          <label className="block mb-1 font-medium" htmlFor="colorInput">顏色</label>
          <input
            id="colorInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          <label className="block mb-1 font-medium" htmlFor="typeInput">車型類別</label>
          <input
            id="typeInput"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          <label className="block mb-1 font-medium" htmlFor="plateNumber">車牌號碼</label>
          <input
            id="plateNumber"
            type="text"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="請輸入車牌號碼"
          />
        </div>

        {/* 配備 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="equipment">配備</label>
          <input
            id="equipment"
            type="text"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="請輸入配備"
          />
        </div>

        {/* 類別 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="category">類別</label>
          <input
            id="category"
            type="text"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="請輸入類別"
          />
        </div>

        {/* 置處 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="location">置處</label>
          <input
            id="location"
            type="text"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="請輸入置處"
          />
        </div>

        {/* 收訂 */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="deposit">收訂</label>
          <input
            id="deposit"
            type="text"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="請輸入收訂金額"
          />
        </div>

        {/* 備注 */}
        <div className="mb-4 col-span-2">
          <label className="block mb-1 font-medium" htmlFor="notes">備注</label>
          <textarea
            id="notes"
            className="border p-3 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="請輸入備注"
            rows="3"
          />
        </div>
      </div>
      
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
        <button 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回列表
        </button>
        <div className="flex gap-3">
          <button 
            className="bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg shadow-sm transition-all"
            type="button"
          >
            儲存為草稿
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            儲存車輛資訊
          </button>
        </div>
      </div>
    </div>
  );
}