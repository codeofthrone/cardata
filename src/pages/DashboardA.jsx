import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, setDoc, updateDoc, query, where } from "firebase/firestore";
import { Helmet } from "react-helmet";
import SaveIcon from '@mui/icons-material/Save';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SpeedIcon from '@mui/icons-material/Speed';
import BuildIcon from '@mui/icons-material/Build';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NoteIcon from '@mui/icons-material/Note';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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
        const brandsRef = collection(db, "settings", "brands", "models");
        const brandsSnapshot = await getDocs(brandsRef);
        
        if (!brandsSnapshot.empty) {
          const brandData = brandsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.id,
            ...doc.data()
          }));
          setBrands(brandData);
          console.log("品牌資料獲取成功:", brandData);
        } else {
          console.log("未找到品牌資料");
          setBrands([]);
        }
      } catch (error) {
        console.error("獲取品牌時出錯:", error);
        setBrands([]);
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
        const modelListRef = collection(db, "settings", "brands", "models", selectedBrand, "model_list");
        const modelListSnapshot = await getDocs(modelListRef);
        
        if (!modelListSnapshot.empty) {
          const modelData = modelListSnapshot.docs.map(doc => ({
            name: doc.id,
            ...doc.data()
          }));
          
          // 更新品牌數據中的車型列表
          const updatedBrands = brands.map(brand => 
            brand.id === selectedBrand 
              ? { ...brand, models: modelData }
              : brand
          );
          
          setBrands(updatedBrands);
          console.log(`已獲取${selectedBrand}的車型:`, modelData);
        }
      } catch (error) {
        console.error(`獲取${selectedBrand}的車型時出錯:`, error);
      } finally {
        setLoading(false);
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
    
    // 允許小數
    if (ccValue && !currentCCs.includes(ccValue)) {
      try {
        const ccValueNum = parseFloat(ccValue);
        if (isNaN(ccValueNum) || ccValueNum <= 0) return;
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
            modelList[selectedModel] = { ccs: [ccValueNum] };
          } else if (!modelList[selectedModel].ccs) {
            modelList[selectedModel].ccs = [ccValueNum];
          } else if (!modelList[selectedModel].ccs.includes(ccValueNum)) {
            modelList[selectedModel].ccs.push(ccValueNum);
          }
          
          await updateDoc(brandModelRef, { model_list: modelList });
          console.log(`已將CC數值 ${ccValueNum} 新增到 ${selectedBrand}/${selectedModel}`);
        } else {
          // 如果品牌文檔不存在，創建它
          await setDoc(brandModelRef, {
            model_list: {
              [selectedModel]: { ccs: [ccValueNum] }
            },
            updated_at: serverTimestamp()
          });
          console.log(`已創建新的車型文檔並添加CC數值 ${ccValueNum}`);
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
              updatedBrands[brandIndex].models[modelIndex] = { name: modelName, ccs: [ccValueNum] };
            } else {
              // 如果車型是對象但沒有ccs屬性，則初始化
              if (!updatedBrands[brandIndex].models[modelIndex].ccs) {
                updatedBrands[brandIndex].models[modelIndex].ccs = [];
              }
              updatedBrands[brandIndex].models[modelIndex].ccs.push(ccValueNum);
            }
          } else {
            // 如果車型不存在，則新增
            updatedBrands[brandIndex].models.push({ name: selectedModel, ccs: [ccValueNum] });
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
  
  // 找到目前選到的車型對應的CC數，只取數字或字串
  const currentCCsRaw = brands.find(b => b.id === selectedBrand || b.name === selectedBrand)
    ?.models?.find(m => m.name === selectedModel)?.ccs;
  const currentCCs = Array.isArray(currentCCsRaw)
    ? currentCCsRaw.filter(cc => typeof cc === 'string' || typeof cc === 'number')
    : [];
    
  // 保存車輛資訊到Firebase
  const saveVehicleInfo = async (isDraft = false) => {
    if (!selectedBrand || !selectedModel) {
      alert('請至少選擇品牌和車型');
      return;
    }
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // 確保用戶已登入
      if (!auth.currentUser) {
        alert('請先登入');
        setSaving(false);
        return;
      }
      
      // 獲取用戶公司信息
      let userCompany = "";
      try {
        // 直接使用doc()獲取單個文檔，而不是使用query和getDocs
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          userCompany = userDocSnap.data().company || "";
        } else {
          console.log("用戶文檔不存在，將使用空公司名稱");
        }
      } catch (err) {
        console.error("獲取用戶公司信息時出錯:", err);
        // 繼續執行，使用空的公司名稱
      }
      
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
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid, // 添加創建者ID
        email: auth.currentUser.email, // 添加用戶email
        company: userCompany // 添加用戶公司信息
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
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>新增車輛資訊</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold d-flex align-items-center gap-2">
            <DirectionsCarIcon className="text-primary" />
            新增車輛資訊
          </h1>
        </div>
        <div className="col-auto">
          <small className="text-muted d-flex align-items-center gap-2">
            <CalendarTodayIcon className="text-muted" />
            {new Date().toLocaleDateString('zh-TW')}
          </small>
        </div>
      </div>

      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* 品牌選擇 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <DirectionsCarIcon className="text-muted" />
                品牌
              </label>
              <input
                id="brandInput"
                className="form-control"
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
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <BuildIcon className="text-muted" />
                車型
              </label>
              <input
                id="modelInput"
                className="form-control"
                list="modelOptions"
                value={selectedModel}
                onChange={handleModelChange}
                placeholder="請選擇或輸入車型"
                disabled={!selectedBrand}
              />
              <datalist id="modelOptions">
                {currentModels
                  .filter(model => typeof model === 'string' || typeof model === 'number' || (model && typeof model.name === 'string'))
                  .map((model, index) => (
                    <option key={index} value={typeof model === 'object' ? model.name : model}>
                      {typeof model === 'object' ? model.name : model}
                    </option>
                  ))}
              </datalist>
            </div>

            {/* CC數選擇 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <SpeedIcon className="text-muted" />
                CC數
              </label>
              <input
                id="ccInput"
                className="form-control"
                list="ccOptions"
                value={selectedCC}
                onChange={handleCCChange}
                placeholder="請選擇或輸入CC數"
                disabled={!selectedModel}
                type="number"
                step="0.1"
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
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <CalendarTodayIcon className="text-muted" />
                年份
              </label>
              <input
                id="yearInput"
                className="form-control"
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
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <ColorLensIcon className="text-muted" />
                顏色
              </label>
              <input
                id="colorInput"
                className="form-control"
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
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <CategoryIcon className="text-muted" />
                車型類別
              </label>
              <input
                id="typeInput"
                className="form-control"
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
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <DirectionsCarIcon className="text-muted" />
                車牌號碼
              </label>
              <input
                id="plateNumber"
                className="form-control"
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="請輸入車牌號碼"
              />
            </div>

            {/* 配備 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <BuildIcon className="text-muted" />
                配備
              </label>
              <input
                id="equipment"
                type="text"
                className="form-control"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="請輸入配備"
              />
            </div>

            {/* 類別 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <CategoryIcon className="text-muted" />
                類別
              </label>
              <input
                id="category"
                type="text"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="請輸入類別"
              />
            </div>

            {/* 置處 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <LocationOnIcon className="text-muted" />
                置處
              </label>
              <input
                id="location"
                type="text"
                className="form-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="請輸入置處"
              />
            </div>

            {/* 收訂 */}
            <div className="col-md-6">
              <label className="form-label d-flex align-items-center gap-2">
                <AttachMoneyIcon className="text-muted" />
                收訂
              </label>
              <input
                id="deposit"
                type="text"
                className="form-control"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="請輸入收訂金額"
              />
            </div>

            {/* 備注 */}
            <div className="col-12">
              <label className="form-label d-flex align-items-center gap-2">
                <NoteIcon className="text-muted" />
                備注
              </label>
              <textarea
                id="notes"
                className="form-control"
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
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <CheckCircleIcon className="me-2" />
          <div>車輛資訊已成功儲存！</div>
        </div>
      )}
      
      <div className="d-flex justify-content-end gap-2">
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          type="button"
          onClick={() => saveVehicleInfo(false)}
          disabled={saving}
        >
          <SaveIcon />
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </div>
  );
}