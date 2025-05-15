import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function DashboardC() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 從Firestore獲取車輛資料
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const vehiclesRef = collection(db, "vehicles");
        const snapshot = await getDocs(vehiclesRef);
        const vehicleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVehicles(vehicleData);
        setFilteredVehicles(vehicleData);
        console.log("獲取到的車輛資料:", vehicleData);
      } catch (error) {
        console.error("獲取車輛資料時出錯:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, []);
  
  // 處理搜尋功能
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = vehicles.filter(vehicle => 
      (vehicle.brand && vehicle.brand.toLowerCase().includes(term)) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(term)) ||
      (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(term))
    );
    
    setFilteredVehicles(filtered);
  };
  
  // 當搜尋詞變更時重置篩選結果
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
    }
  }, [searchTerm, vehicles]);
  
  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>車輛總覽</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold">車輛總覽</h1>
        </div>
        <div className="col-auto">
          <small className="text-muted">{new Date().toLocaleDateString('zh-TW')}</small>
        </div>
      </div>
      
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row mb-4 g-3">
            <div className="col-12 col-md">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="搜尋車輛（品牌、型號、車牌）"
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-auto d-flex gap-2">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel" viewBox="0 0 16 16">
                  <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
                </svg>
                篩選
              </button>
              <button 
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleSearch}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
                搜尋
              </button>
            </div>
          </div>
          
          <div className="table-responsive mt-3">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">車牌號碼</th>
                  <th scope="col">品牌/型號</th>
                  <th scope="col">CC數</th>
                  <th scope="col">顏色</th>
                  <th scope="col">狀態</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="text-center">
                    <td colSpan="6" className="py-5">
                      <div className="d-flex flex-column align-items-center justify-content-center py-4">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">載入中...</span>
                        </div>
                        <p className="text-muted">載入車輛資料中...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVehicles.length > 0 ? (
                  filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.plateNumber || '未設定'}</td>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>{vehicle.cc || '未設定'}</td>
                      <td>{vehicle.color || '未設定'}</td>
                      <td>
                        <span className={`badge ${vehicle.status === 'active' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {vehicle.status === 'active' ? '正常' : '草稿'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                          </svg>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan="6" className="py-5 text-muted">
                      <div className="d-flex flex-column align-items-center justify-content-center py-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-car-front text-secondary mb-3" viewBox="0 0 16 16">
                          <path d="M4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2H6ZM4.862 4.276 3.906 6.19a.51.51 0 0 0 .497.731c.91-.073.995-.375 1.076-.928.086-.553.342-1.29.342-1.29a.5.5 0 0 1 .497-.731c.91.073.995.375 1.076.929.086.552.342 1.29.342 1.29a.5.5 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 6.826 4H5.9a.5.5 0 0 0-.447.276ZM2.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-11 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
                          <path d="M9.89 4.765A1.5 1.5 0 0 0 8.5 4h-1a1.5 1.5 0 0 0-1.39.765L5.354 6H2a.5.5 0 0 0-.5.5v4A2.5 2.5 0 0 0 4 13h8a2.5 2.5 0 0 0 2.5-2.5v-4a.5.5 0 0 0-.5-.5h-3.354l-.756-1.235ZM2.5 7.5V10h11V7.5h-11Z"/>
                        </svg>
                        <p>{searchTerm ? '沒有符合搜尋條件的車輛' : '暫無車輛資料'}</p>
                        <button className="btn btn-primary mt-2">
                          新增車輛
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <nav aria-label="Page navigation" className="mt-4">
            <ul className="pagination justify-content-center">
              <li className="page-item disabled">
                <a className="page-link" href="#" tabIndex="-1" aria-disabled="true">上一頁</a>
              </li>
              <li className="page-item active"><a className="page-link" href="#">1</a></li>
              <li className="page-item disabled">
                <a className="page-link" href="#">下一頁</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
  