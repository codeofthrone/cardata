import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SellIcon from '@mui/icons-material/Sell';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';

export default function DashboardC() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const { currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    status: 'active',
    company: '',
    sold: false
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 從Firestore獲取車輛資料
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const vehiclesRef = collection(db, "vehicles");
        
        // 獲取用戶公司信息
        let userCompany = "";
        if (currentUser) {
          try {
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
            if (!userDoc.empty) {
              userCompany = userDoc.docs[0].data().company || "";
            }
          } catch (err) {
            console.error("獲取用戶公司信息時出錯:", err);
          }
        }
        
        // 修改：只使用 createdAt 排序，狀態過濾在客戶端進行
        const vehiclesQuery = query(
          vehiclesRef,
          orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(vehiclesQuery);
        const vehicleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // 提取所有公司、品牌和型號用於篩選
        const uniqueCompanies = [...new Set(vehicleData.map(v => v.company).filter(Boolean))];
        const uniqueBrands = [...new Set(vehicleData.map(v => v.brand).filter(Boolean))];
        const uniqueModels = [...new Set(vehicleData.map(v => v.model).filter(Boolean))];
        
        setCompanies(uniqueCompanies);
        setBrands(uniqueBrands);
        setModels(uniqueModels);
        setVehicles(vehicleData);
        setFilteredVehicles(vehicleData);
        
        // 添加更詳細的控制台輸出
        console.log("獲取到的所有車輛資料:", vehicleData);
        console.log("車輛總數:", vehicleData.length);
        console.log("公司列表:", uniqueCompanies);
        console.log("品牌列表:", uniqueBrands);
        console.log("型號列表:", uniqueModels);
      } catch (error) {
        console.error("獲取車輛資料時出錯:", error);
        setVehicles([]);
        setFilteredVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, [currentUser]);
  
  // 處理搜尋和篩選功能
  useEffect(() => {
    let filtered = vehicles;
    
    // 應用搜尋篩選
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vehicle => 
        (vehicle.brand && vehicle.brand.toLowerCase().includes(term)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(term)) ||
        (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(term))
      );
    }
    
    // 應用狀態篩選
    if (statusFilter) {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    // 應用品牌篩選
    if (brandFilter) {
      filtered = filtered.filter(vehicle => vehicle.brand === brandFilter);
    }
    
    // 應用型號篩選
    if (modelFilter) {
      filtered = filtered.filter(vehicle => vehicle.model === modelFilter);
    }
    
    // 應用公司篩選
    if (companyFilter) {
      filtered = filtered.filter(vehicle => vehicle.company === companyFilter);
    }
    
    // 添加過濾後的數據輸出
    console.log("過濾後的車輛資料:", filtered);
    console.log("過濾條件:", {
      searchTerm: searchTerm.trim(),
      statusFilter,
      brandFilter,
      modelFilter,
      companyFilter
    });
    
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, brandFilter, modelFilter, companyFilter, vehicles]);
  
  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 獲取當前用戶的公司信息
      let userCompany = "";
      if (currentUser) {
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
          if (!userDoc.empty) {
            userCompany = userDoc.docs[0].data().company || "";
          }
        } catch (err) {
          console.error("獲取用戶公司信息時出錯:", err);
        }
      }
      
      // 設置公司信息並保存車輛
      const vehicleData = {
        ...form,
        company: form.company || userCompany,
        sold: false,
        createdAt: new Date()
      };
      
      if (editingVehicle) {
        // 更新車輛
        const vehicleRef = doc(db, 'vehicles', editingVehicle);
        await updateDoc(vehicleRef, vehicleData);
      } else {
        // 新增車輛
        await addDoc(collection(db, 'vehicles'), vehicleData);
      }
      
      setShowAddModal(false);
      setEditingVehicle(null);
      setForm({
        plateNumber: '',
        brand: '',
        model: '',
        status: 'active',
        company: '',
        sold: false
      });
      
      // 重新獲取所有車輛資料
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(
        vehiclesRef,
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(vehiclesQuery);
      vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 添加更詳細的控制台輸出
      console.log("提交後獲取到的所有車輛資料:", vehicleData);
      console.log("提交後車輛總數:", vehicleData.length);
      
      setVehicles(vehicleData);
      setFilteredVehicles(vehicleData);
    } catch (error) {
      console.error("儲存車輛時出錯:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle.id);
    setForm({
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      status: vehicle.status,
      company: vehicle.company || ''
    });
    setShowAddModal(true);
  };
  
  const handleSold = async (id) => {
    try {
      // 將車輛標記為已售出，而不是刪除
      const vehicleRef = doc(db, 'vehicles', id);
      await updateDoc(vehicleRef, { sold: true });
      // 從顯示列表中移除
      setFilteredVehicles(filteredVehicles.filter(vehicle => vehicle.id !== id));
    } catch (error) {
      console.error("標記車輛為已售出時出錯:", error);
    }
  };
  
  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>車輛總覽</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold d-flex align-items-center gap-2">
            <DirectionsCarIcon className="text-primary" />
            車輛管理
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
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="搜尋車牌號碼..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <AddIcon />
                新增車輛
              </button>
            </div>
          </div>
          
          <div className="row g-3 mt-2">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FilterListIcon />
                </span>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">所有狀態</option>
                  <option value="active">使用中</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <BrandingWatermarkIcon />
                </span>
                <select
                  className="form-select"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <option value="">所有品牌</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <CategoryIcon />
                </span>
                <select
                  className="form-select"
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                >
                  <option value="">所有型號</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <BusinessIcon />
                </span>
                <select
                  className="form-select"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <option value="">所有公司</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card shadow">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>車牌號碼</th>
                  <th>品牌</th>
                  <th>型號</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.plateNumber}</td>
                    <td>{vehicle.brand}</td>
                    <td>{vehicle.model}</td>
                    <td>
                      <span className={`badge bg-${vehicle.status === 'active' ? 'success' : 'warning'}`}>
                        {vehicle.status === 'active' ? '使用中' : '草稿'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <EditIcon />
                          編輯
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2"
                          onClick={() => handleSold(vehicle.id)}
                        >
                          <SellIcon />
                          售出
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 新增/編輯車輛 Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingVehicle ? '編輯車輛' : '新增車輛'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVehicle(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">車牌號碼</label>
                    <input
                      type="text"
                      className="form-control"
                      name="plateNumber"
                      value={form.plateNumber}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">品牌</label>
                    <input
                      type="text"
                      className="form-control"
                      name="brand"
                      value={form.brand}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">型號</label>
                    <input
                      type="text"
                      className="form-control"
                      name="model"
                      value={form.model}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">狀態</label>
                    <select
                      className="form-select"
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="active">使用中</option>
                      <option value="draft">草稿</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">公司</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company"
                      value={form.company}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2 d-flex align-items-center gap-2"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingVehicle(null);
                      }}
                    >
                      <CancelIcon />
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={submitting}
                    >
                      <SaveIcon />
                      {submitting ? '儲存中...' : '儲存'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  