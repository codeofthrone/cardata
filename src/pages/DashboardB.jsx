import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function DashboardB() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
        console.log("獲取到的車輛資料:", vehicleData);
      } catch (error) {
        console.error("獲取車輛資料時出錯:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, []);
  
  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>維修進程管理</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold">維修進程管理</h1>
        </div>
        <div className="col-auto">
          <small className="text-muted">{new Date().toLocaleDateString('zh-TW')}</small>
        </div>
      </div>
      
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="card-title h5 fw-semibold">維修狀態總覽</h2>
            <button className="btn btn-primary d-flex align-items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              新增維修記錄
            </button>
          </div>
          
          <div className="row mt-4">
            <div className="col-md-6 mb-4 mb-md-0">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-subtitle h6 fw-medium">待處理維修</h3>
                    <span className="badge bg-warning text-dark rounded-pill">0 項目</span>
                  </div>
                  <div className="border border-2 border-dashed rounded p-4 d-flex justify-content-center align-items-center bg-light" style={{height: "160px"}}>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-inbox text-secondary mb-2" viewBox="0 0 16 16">
                        <path d="M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4H4.98zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374l3.7-4.625z"/>
                      </svg>
                      <span className="text-muted">尚無待處理項目</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-subtitle h6 fw-medium">已完成維修</h3>
                    <span className="badge bg-success rounded-pill">0 項目</span>
                  </div>
                  <div className="border border-2 border-dashed rounded p-4 d-flex justify-content-center align-items-center bg-light" style={{height: "160px"}}>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-check-circle text-secondary mb-2" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                      </svg>
                      <span className="text-muted">尚無已完成項目</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title h5 fw-semibold mb-4">車輛資料</h2>
          <hr className="my-3" />
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">載入中...</span>
              </div>
              <p className="mt-2 text-muted">載入車輛資料中...</p>
            </div>
          ) : vehicles.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col">車牌號碼</th>
                    <th scope="col">品牌/型號</th>
                    <th scope="col">CC數</th>
                    <th scope="col">顏色</th>
                    <th scope="col">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(vehicle => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-car-front text-secondary mb-3" viewBox="0 0 16 16">
                <path d="M4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2H6ZM4.862 4.276 3.906 6.19a.51.51 0 0 0 .497.731c.91-.073.995-.375 1.076-.928.086-.553.342-1.29.342-1.29a.5.5 0 0 1 .497-.731c.91.073.995.375 1.076.929.086.552.342 1.29.342 1.29a.5.5 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 6.826 4H5.9a.5.5 0 0 0-.447.276ZM2.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-11 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
                <path d="M9.89 4.765A1.5 1.5 0 0 0 8.5 4h-1a1.5 1.5 0 0 0-1.39.765L5.354 6H2a.5.5 0 0 0-.5.5v4A2.5 2.5 0 0 0 4 13h8a2.5 2.5 0 0 0 2.5-2.5v-4a.5.5 0 0 0-.5-.5h-3.354l-.756-1.235ZM2.5 7.5V10h11V7.5h-11Z"/>
              </svg>
              <p>暫無車輛資料</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  