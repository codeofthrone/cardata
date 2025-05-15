import { useState, useEffect } from "react";
import { 
  fetchBrands, 
  fetchModelsByBrand, 
  fetchCCValuesByModel,
  addCCValue 
} from "../utils/firestoreModelCC";

/**
 * 品牌、車型和CC數值連動選擇器組件
 * 使用優化的Firestore數據結構
 */
export default function ModelCCSelector({ onSelect }) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [ccValues, setCCValues] = useState([]);
  
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCC, setSelectedCC] = useState("");
  const [customCC, setCustomCC] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 獲取品牌列表
  useEffect(() => {
    const getBrands = async () => {
      setLoading(true);
      setError("");
      try {
        const brandData = await fetchBrands();
        setBrands(brandData);
      } catch (err) {
        console.error("獲取品牌列表時出錯:", err);
        setError("獲取品牌列表失敗");
      } finally {
        setLoading(false);
      }
    };
    
    getBrands();
  }, []);
  
  // 當選擇品牌時，獲取該品牌的車型
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel("");
      return;
    }
    
    const getModels = async () => {
      setLoading(true);
      setError("");
      try {
        const modelData = await fetchModelsByBrand(selectedBrand);
        setModels(modelData);
      } catch (err) {
        console.error(`獲取品牌(${selectedBrand})的車型時出錯:`, err);
        setError("獲取車型列表失敗");
      } finally {
        setLoading(false);
      }
    };
    
    getModels();
  }, [selectedBrand]);
  
  // 當選擇車型時，獲取該車型的CC數值
  useEffect(() => {
    if (!selectedModel) {
      setCCValues([]);
      setSelectedCC("");
      return;
    }
    
    const getCCValues = async () => {
      setLoading(true);
      setError("");
      try {
        const ccData = await fetchCCValuesByModel(selectedModel);
        setCCValues(ccData);
      } catch (err) {
        console.error(`獲取車型(${selectedModel})的CC數值時出錯:`, err);
        setError("獲取CC數值列表失敗");
      } finally {
        setLoading(false);
      }
    };
    
    getCCValues();
  }, [selectedModel]);
  
  // 處理品牌變更
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setSelectedBrand(brandId);
    setSelectedModel(""); // 重置車型
    setSelectedCC(""); // 重置CC數值
    setCustomCC(""); // 重置自定義CC數值
  };
  
  // 處理車型變更
  const handleModelChange = (e) => {
    const modelId = e.target.value;
    setSelectedModel(modelId);
    setSelectedCC(""); // 重置CC數值
    setCustomCC(""); // 重置自定義CC數值
  };
  
  // 處理CC數值變更
  const handleCCChange = (e) => {
    const ccValue = e.target.value;
    setSelectedCC(ccValue);
    
    // 如果選擇了「自定義」選項，則不觸發onSelect
    if (ccValue !== "custom") {
      onSelect && onSelect({
        brandId: selectedBrand,
        brandName: brands.find(b => b.id === selectedBrand)?.name || "",
        modelId: selectedModel,
        modelName: models.find(m => m.id === selectedModel)?.name || "",
        cc: ccValue
      });
    }
  };
  
  // 處理自定義CC數值變更
  const handleCustomCCChange = (e) => {
    setCustomCC(e.target.value);
  };
  
  // 添加自定義CC數值
  const handleAddCustomCC = async () => {
    if (!customCC || !selectedModel) return;
    
    const ccValue = parseInt(customCC, 10);
    if (isNaN(ccValue) || ccValue <= 0) {
      setError("請輸入有效的CC數值");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // 添加新的CC數值
      await addCCValue({
        value: ccValue,
        modelId: selectedModel
      });
      
      // 重新獲取CC數值列表
      const ccData = await fetchCCValuesByModel(selectedModel);
      setCCValues(ccData);
      
      // 選擇新添加的CC數值
      setSelectedCC(ccValue.toString());
      setCustomCC(""); // 清空自定義輸入
      
      // 觸發選擇事件
      onSelect && onSelect({
        brandId: selectedBrand,
        brandName: brands.find(b => b.id === selectedBrand)?.name || "",
        modelId: selectedModel,
        modelName: models.find(m => m.id === selectedModel)?.name || "",
        cc: ccValue
      });
    } catch (err) {
      console.error("添加自定義CC數值時出錯:", err);
      setError("添加CC數值失敗");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">車輛型號選擇</h5>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <div className="row g-3">
          {/* 品牌選擇 */}
          <div className="col-md-4">
            <label className="form-label">品牌</label>
            <select 
              className="form-select" 
              value={selectedBrand} 
              onChange={handleBrandChange}
              disabled={loading || brands.length === 0}
            >
              <option value="">請選擇品牌</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 車型選擇 */}
          <div className="col-md-4">
            <label className="form-label">車型</label>
            <select 
              className="form-select" 
              value={selectedModel} 
              onChange={handleModelChange}
              disabled={loading || !selectedBrand || models.length === 0}
            >
              <option value="">請選擇車型</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* CC數值選擇 */}
          <div className="col-md-4">
            <label className="form-label">CC數</label>
            <select 
              className="form-select" 
              value={selectedCC} 
              onChange={handleCCChange}
              disabled={loading || !selectedModel}
            >
              <option value="">請選擇CC數</option>
              {ccValues.map(cc => (
                <option key={cc.id} value={cc.value}>
                  {cc.value} cc
                </option>
              ))}
              <option value="custom">自定義...</option>
            </select>
          </div>
          
          {/* 自定義CC數值輸入 */}
          {selectedCC === "custom" && (
            <div className="col-12 mt-3">
              <div className="input-group">
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="請輸入CC數值" 
                  value={customCC}
                  onChange={handleCustomCCChange}
                  disabled={loading}
                />
                <span className="input-group-text">cc</span>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddCustomCC}
                  disabled={loading || !customCC}
                >
                  {loading ? "處理中..." : "新增"}
                </button>
              </div>
              <div className="form-text">請輸入有效的CC數值，例如：1800、2000等</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}