import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, setDoc, updateDoc, query, where } from "firebase/firestore";
import { Helmet } from "react-helmet";
import SaveIcon from '@mui/icons-material/Save';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SpeedIcon from '@mui/icons-material/Speed';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 顏色、車型類別和年份選項狀態
  const [colorOptions, setColorOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  
  // 生成年份選項 (從當前年份往前推30年)
  const currentYear = new Date().getFullYear();

  // 獲取選項數據（顏色、車型類別、年份）
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // 獲取選項設置
        const optionsRef = doc(db, "settings", "options");
        const optionsDoc = await getDoc(optionsRef);
        
        if (optionsDoc.exists()) {
          const optionsData = optionsDoc.data();
          
          // 設置顏色選項
          if (optionsData.colors && Array.isArray(optionsData.colors)) {
            setColorOptions(optionsData.colors);
          } else {
            // 默認顏色選項
            const defaultColors = ["黑色", "白色", "銀色", "紅色", "藍色", "灰色", "其他"];
            setColorOptions(defaultColors);
            // 保存默認顏色到Firestore
            await setDoc(optionsRef, { colors: defaultColors }, { merge: true });
          }
          
          // 設置車型類別選項
          if (optionsData.types && Array.isArray(optionsData.types)) {
            setTypeOptions(optionsData.types);
          } else {
            // 默認車型類別選項
            const defaultTypes = ["轎車", "休旅車", "跑車", "商用車", "其他"];
            setTypeOptions(defaultTypes);
            // 保存默認車型類別到Firestore
            await updateDoc(optionsRef, { types: defaultTypes });
          }
          
          // 設置年份選項
          if (optionsData.years && Array.isArray(optionsData.years)) {
            setYearOptions(optionsData.years);
          } else {
            // 默認年份選項 (從當前年份往前推30年)
            const defaultYears = Array.from({ length: 31 }, (_, i) => (currentYear - i).toString());
            setYearOptions(defaultYears);
            // 保存默認年份到Firestore
            await updateDoc(optionsRef, { years: defaultYears });
          }
          
        } else {
          // 如果文檔不存在，創建它並設置默認值
          const defaultColors = ["黑色", "白色", "銀色", "紅色", "藍色", "灰色", "其他"];
          const defaultTypes = ["轎車", "休旅車", "跑車", "商用車", "其他"];
          const defaultYears = Array.from({ length: 31 }, (_, i) => (currentYear - i).toString());
          
          await setDoc(optionsRef, {
            colors: defaultColors,
            types: defaultTypes,
            years: defaultYears
          });
          
          setColorOptions(defaultColors);
          setTypeOptions(defaultTypes);
          setYearOptions(defaultYears);
        }
      } catch (error) {
        console.error("獲取選項設置時出錯:", error);
        // 設置默認值
        const defaultColors = ["黑色", "白色", "銀色", "紅色", "藍色", "灰色", "其他"];
        const defaultTypes = ["轎車", "休旅車", "跑車", "商用車", "其他"];
        const defaultYears = Array.from({ length: 31 }, (_, i) => (currentYear - i).toString());
        
        setColorOptions(defaultColors);
        setTypeOptions(defaultTypes);
        setYearOptions(defaultYears);
      }
    };
    
    fetchOptions();
  }, [currentYear]);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        // 獲取品牌列表
        const brandsRef = doc(db, "settings", "brands");
        const brandsDoc = await getDoc(brandsRef);
        
        if (brandsDoc.exists()) {
          // 獲取models子集合
          const modelsCollectionRef = collection(db, "settings", "brands", "models");
          const modelsSnapshot = await getDocs(modelsCollectionRef);
          
          if (!modelsSnapshot.empty) {
            const brandData = modelsSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.id, // 使用文檔ID作為名稱
              ...doc.data()
            }));
            setBrands(brandData);
            console.log("品牌資料獲取成功:", brandData);
          } else {
            console.log("在settings/brands/models中未找到品牌，嘗試替代路徑");
            throw new Error("主要路徑中未找到品牌");
          }
        } else {
          throw new Error("settings/brands文檔不存在");
        }
      } catch (error) {
        console.error("獲取品牌時出錯:", error);
        try {
          // 嘗試從直接的brands集合中獲取作為備用
          const snapshot = await getDocs(collection(db, "brands"));
          const brandData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.id,
            ...doc.data()
          }));
          setBrands(brandData);
          console.log("從替代路徑獲取品牌:", brandData);
        } catch (err) {
          console.error("從替代路徑獲取品牌失敗:", err);
          setBrands([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, []);

  // 獲取選定品牌的車型
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrand) {
        return;
      }
      
      setLoading(true);
      try {
        // 獲取車型列表
        const modelsSnapshot = await getDocs(collection(db, "settings", "brands", "models", selectedBrand, "model_list"));
        
        if (!modelsSnapshot.empty) {
          // 獲取車型數據
          const modelData = [];
          
          modelsSnapshot.docs.forEach(doc => {
            modelData.push(doc.id);
          });
          
          // 更新品牌數據中的車型列表
          const selectedBrandData = {...brands.find(b => b.id === selectedBrand)};
          selectedBrandData.models = modelData;
          
          // 更新品牌數組
          setBrands(prev => prev.map(brand => 
            brand.id === selectedBrand ? selectedBrandData : brand
          ));
          
          console.log(`已獲取${selectedBrand}的車型:`, modelData);
        }
      } catch (error) {
        console.error(`獲取${selectedBrand}的車型時出錯:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, [selectedBrand, brands]);

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    setSelectedModel(""); // 重置車型
    setSelectedCC(""); // 重置CC
  };

  const handleModelChange = (e) => {
    const model = e.target.value;
    setSelectedModel(model);
    setSelectedCC(""); // 重置CC
  };
  
  // 處理顏色變更，如果不存在則新增到資料庫
  const handleColorChange = async (e) => {
    const colorValue = e.target.value;
    setSelectedColor(colorValue);
    
    // 如果顏色不為空且不在現有列表中，則新增到資料庫
    if (colorValue && !colorOptions.includes(colorValue)) {
      try {
        // 更新本地狀態
        const updatedColors = [...colorOptions, colorValue];
        setColorOptions(updatedColors);
        
        // 更新Firestore資料庫
        const optionsRef = doc(db, "settings", "options");
        await updateDoc(optionsRef, { colors: updatedColors });
        console.log(`已將顏色 ${colorValue} 新增到資料庫`);
      } catch (error) {
        console.error("更新顏色選項時出錯:", error);
      }
    }
  };
  
  // 處理車型類別變更，如果不存在則新增到資料庫
  const handleTypeChange = async (e) => {
    const typeValue = e.target.value;
    setSelectedType(typeValue);
    
    // 如果車型類別不為空且不在現有列表中，則新增到資料庫
    if (typeValue && !typeOptions.includes(typeValue)) {
      try {
        // 更新本地狀態
        const updatedTypes = [...typeOptions, typeValue];
        setTypeOptions(updatedTypes);
        
        // 更新Firestore資料庫
        const optionsRef = doc(db, "settings", "options");
        await updateDoc(optionsRef, { types: updatedTypes });
        console.log(`已將車型類別 ${typeValue} 新增到資料庫`);
      } catch (error) {
        console.error("更新車型類別選項時出錯:", error);
      }
    }
  };
  
  // 處理年份變更，如果不存在則新增到資料庫
  const handleYearChange = async (e) => {
    const yearValue = e.target.value;
    setSelectedYear(yearValue);
    
    // 如果年份不為空且不在現有列表中，則新增到資料庫
    if (yearValue && !yearOptions.includes(yearValue)) {
      try {
        // 更新本地狀態
        const updatedYears = [...yearOptions, yearValue].sort((a, b) => parseInt(b) - parseInt(a)); // 降序排序
        setYearOptions(updatedYears);
        
        // 更新Firestore資料庫
        const optionsRef = doc(db, "settings", "options");
        await updateDoc(optionsRef, { years: updatedYears });
        console.log(`已將年份 ${yearValue} 新增到資料庫`);
      } catch (error) {
        console.error("更新年份選項時出錯:", error);
      }
    }
  };
  
  // 處理CC數值變更，如果不存在則新增到資料庫
  const handleCCChange = async (e) => {
    const ccValue = e.target.value;
    setSelectedCC(ccValue);
    
    // 如果CC數值不為空且不在現有列表中，則新增到資料庫
    if (ccValue && !currentCCs.includes(ccValue)) {
      try {
        // 更新Firestore資料庫 - 使用正確的層級結構
        // 首先確保settings/brands文檔存在
        const brandsSettingsRef = doc(db, "settings", "brands");
        await setDoc(brandsSettingsRef, { updated_at: serverTimestamp() }, { merge: true });
        
        // 然後確保品牌文檔存在於models子集合中
        const brandModelRef = doc(db, "settings", "brands", "models", selectedBrand);
        const brandModelDoc = await getDoc(brandModelRef);
        
        if (brandModelDoc.exists()) {
          // 如果品牌文檔存在，更新它
          const modelData = brandModelDoc.data();
          let modelList = modelData.model_list || {};
          
          if (!modelList[selectedModel]) {
            modelList[selectedModel] = { ccs: [ccValue] };
          } else if (!modelList[selectedModel].ccs) {
            modelList[selectedModel].ccs = [ccValue];
          } else if (!modelList[selectedModel].ccs.includes(ccValue)) {
            modelList[selectedModel].ccs.push(ccValue);
          }
          
          await updateDoc(brandModelRef, { model_list: modelList });
          console.log(`已將CC數值 ${ccValue} 新增到 ${selectedBrand}/${selectedModel}`);
        } else {
          // 如果品牌文檔不存在，創建它
          await setDoc(brandModelRef, {
            model_list: {
              [selectedModel]: { ccs: [ccValue] }
            },
            updated_at: serverTimestamp()
          });
          console.log(`已創建新的車型文檔並添加CC數值 ${ccValue}`);
        }
        
        // 更新本地狀態以反映變更
        const updatedBrands = [...brands];
        const brandIndex = updatedBrands.findIndex(b => b.id === selectedBrand || b.name === selectedBrand);
        
        if (brandIndex !== -1) {
          // 如果品牌存在但沒有models屬性，則初始化
          if (!updatedBrands[brandIndex].models) {
            updatedBrands[brandIndex].models = [];
          }
          
          // 找到對應的車型
          const modelIndex = updatedBrands[brandIndex].models.findIndex(
            m => typeof m === 'object' ? m.name === selectedModel : m === selectedModel
          );
          
          if (modelIndex !== -1) {
            // 如果車型是字符串，轉換為對象
            if (typeof updatedBrands[brandIndex].models[modelIndex] === 'string') {
              const modelName = updatedBrands[brandIndex].models[modelIndex];
              updatedBrands[brandIndex].models[modelIndex] = { name: modelName, ccs: [ccValue] };
            } else {
              // 如果車型是對象但沒有ccs屬性，則初始化
              if (!updatedBrands[brandIndex].models[modelIndex].ccs) {
                updatedBrands[brandIndex].models[modelIndex].ccs = [];
              }
              updatedBrands[brandIndex].models[modelIndex].ccs.push(ccValue);
            }
          } else {
            // 如果車型不存在，則新增
            updatedBrands[brandIndex].models.push({ name: selectedModel, ccs: [ccValue] });
          }
          
          setBrands(updatedBrands);
        }
      } catch (error) {
        console.error("處理CC數值變更時出錯:", error);
      }
    }
  };

  // 找到目前選到的品牌對應的車型
  const currentModels = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)?.models || [];
  
  // 找到目前選到的車型對應的CC數
  const currentCCs = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)
    ?.models?.find(m => m.name === selectedModel)?.ccs || [];
    
  // 保存車輛資訊到Firebase
  const saveVehicleInfo = async (isDraft = false) => {
    if (!selectedBrand || !selectedModel) {
      alert('請至少選擇品牌和車型');
      return;
    }
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // 準備車輛資料
      const vehicleData = {
        brand: selectedBrand,
        model: selectedModel,
        cc: selectedCC,
        year: selectedYear,
        color: selectedColor,
        type: selectedType,
        plateNumber,
        equipment,
        category,
        location,
        deposit,
        notes,
        status: isDraft ? 'draft' : 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // 保存到Firebase
      const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
      console.log("車輛資訊已保存，文檔ID:", docRef.id);
      
      // 顯示成功訊息
      setSaveSuccess(true);
      
      // 如果不是草稿，則重置表單
      if (!isDraft) {
        setSelectedBrand("");
        setSelectedModel("");
        setSelectedCC("");
        setSelectedYear("");
        setSelectedColor("");
        setSelectedType("");
        setPlateNumber("");
        setEquipment("");
        setCategory("");
        setLocation("");
        setDeposit("");
        setNotes("");

      }
      
      // 3秒後隱藏成功訊息
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("保存車輛資訊時出錯:", error);
      alert(`保存失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-screen flex flex-col overflow-hidden">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>新增車輛資訊</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">新增車輛資訊</h2>
        </div>
        <div>
          <div className="text-gray-500">{new Date().toLocaleDateString('zh-TW')}</div>
        </div>
      </div>

      {/* 載入中提示 */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-md mb-6 border border-gray-100">
          <div className="flex justify-center items-center py-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-500">載入中...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-md mb-6 border border-gray-100 flex-1 overflow-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 品牌選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="brandInput">品牌</label>
              <input
                id="brandInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="modelInput">車型</label>
              <input
                id="modelInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-gray-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ccInput">CC數</label>
              <input
                id="ccInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-gray-500"
                list="ccOptions"
                value={selectedCC}
                onChange={handleCCChange}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="yearInput">年份</label>
              <input
                id="yearInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                list="yearOptions"
                value={selectedYear}
                onChange={handleYearChange}
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
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="colorInput">顏色</label>
              <input
                id="colorInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                list="colorOptions"
                value={selectedColor}
                onChange={handleColorChange}
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
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="typeInput">車型類別</label>
              <input
                id="typeInput"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                list="typeOptions"
                value={selectedType}
                onChange={handleTypeChange}
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
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="plateNumber">車牌號碼</label>
              <input
                id="plateNumber"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="請輸入車牌號碼"
              />
            </div>

            {/* 配備 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="equipment">配備</label>
              <input
                id="equipment"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="請輸入配備"
              />
            </div>

            {/* 類別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">類別</label>
              <input
                id="category"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="請輸入類別"
              />
            </div>

            {/* 置處 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">置處</label>
              <input
                id="location"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="請輸入置處"
              />
            </div>

            {/* 收訂 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deposit">收訂</label>
              <input
                id="deposit"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="請輸入收訂金額"
              />
            </div>

            {/* 備注 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">備注</label>
              <textarea
                id="notes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="請輸入備注"
                rows="3"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 成功提示 */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 flex items-center mb-6" role="alert">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
          <div>
            車輛資訊已成功儲存！
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4 mb-4 sticky bottom-0 bg-white p-2 shadow-md rounded-lg">
        <button 
          className="px-5 py-2.5 bg-gray-100 text-gray-800 rounded-2xl hover:bg-gray-200 transition duration-150 ease-in-out flex items-center justify-center gap-2 shadow-sm"
          type="button"
        >
          <ArrowBackIcon className="w-5 h-5" />
          返回列表
        </button>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            className="px-5 py-2.5 border border-blue-500 text-blue-600 rounded-2xl hover:bg-blue-50 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 shadow-sm"
            type="button"
            onClick={() => saveVehicleInfo(true)}
            disabled={saving}
          >
            <DriveFileRenameOutlineIcon className="w-5 h-5 mr-2" />
            {saving ? "儲存中..." : "儲存為草稿"}
          </button>
          <button 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 shadow-sm"
            type="button"
            onClick={() => saveVehicleInfo(false)}
            disabled={saving}
          >
            <SaveIcon className="w-5 h-5 mr-2" />
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}