import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { getRepairs, addRepair, updateRepairStatus } from "../utils/firestoreRepairs";
import { uploadFile } from "../utils/firebaseStorage";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import BuildIcon from '@mui/icons-material/Build';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SaveIcon from '@mui/icons-material/Save';

export default function DashboardB() {
  const [vehicles, setVehicles] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vehicleId: "",
    item: "",
    location: "",
    date: "",
    partNumber: "",
    cost: "",
    status: "pending",
    invoiceFile: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  // 取得車輛清單
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const vehiclesRef = collection(db, "vehicles");
        const vehiclesQuery = query(vehiclesRef, where("status", "==", "active"));
        const snapshot = await getDocs(vehiclesQuery);
        const vehicleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVehicles(vehicleData);
      } catch (error) {
        console.error("獲取車輛資料時出錯:", error);
        setError("獲取車輛資料時出錯");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 取得所有維修紀錄
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        setLoading(true);
        const repairsRef = collection(db, "repairs");
        const repairsQuery = query(repairsRef, where("status", "in", ["pending", "done"]));
        const snapshot = await getDocs(repairsQuery);
        const repairData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRepairs(repairData);
      } catch (error) {
        console.error("獲取維修紀錄時出錯:", error);
        setError("獲取維修紀錄時出錯");
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  // 表單欄位變更
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "invoiceFile") {
      const file = files[0];
      if (file) {
        // 檢查檔案大小（限制為 10MB）
        if (file.size > 10 * 1024 * 1024) {
          setError("檔案大小不能超過 10MB");
          e.target.value = null;
          return;
        }
        setForm(f => ({ ...f, invoiceFile: file }));
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // 新增維修紀錄
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    // 檢查用戶是否已認證
    if (!currentUser) {
      setError("用戶未登入，請先登入後再試");
      setSubmitting(false);
      return;
    }
    
    try {
      let invoiceUrl = "";
      if (form.invoiceFile) {
        try {
          // 建立檔案路徑：repairs/{timestamp}_{filename}
          const timestamp = new Date().getTime();
          const fileName = form.invoiceFile.name;
          const filePath = `repairs/${timestamp}_${fileName}`;
          
          // 上傳檔案到 Firebase Storage
          invoiceUrl = await uploadFile(form.invoiceFile, filePath);
        } catch (error) {
          console.error("上傳檔案失敗:", error);
          setError(error.message || "上傳檔案失敗，請重試");
          setSubmitting(false);
          return;
        }
      }

      await addRepair({
        vehicleId: form.vehicleId,
        item: form.item,
        location: form.location,
        date: form.date,
        partNumber: form.partNumber,
        cost: parseFloat(form.cost),
        status: form.status,
        invoiceUrl,
        userId: currentUser.uid, // 添加用戶ID以便與安全規則匹配
      });

      setForm({
        vehicleId: "",
        item: "",
        location: "",
        date: "",
        partNumber: "",
        cost: "",
        status: "pending",
        invoiceFile: null,
      });

      // 重新取得維修紀錄
      const data = await getRepairs();
      setRepairs(data);
    } catch (err) {
      console.error("新增維修紀錄失敗:", err);
      setError(err.message || "新增維修紀錄失敗");
    } finally {
      setSubmitting(false);
    }
  };

  // 切換維修狀態
  const handleStatusToggle = async (repairId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "done" : "pending";
    await updateRepairStatus(repairId, newStatus);
    const data = await getRepairs();
    setRepairs(data);
  };

  // 彙總每台車輛的總花費
  const vehicleCostMap = {};
  repairs.forEach(r => {
    if (!vehicleCostMap[r.vehicleId]) vehicleCostMap[r.vehicleId] = 0;
    if (typeof r.cost === 'number') vehicleCostMap[r.vehicleId] += r.cost;
  });

  // 狀態分類
  const pendingRepairs = repairs.filter(r => r.status === "pending");
  const doneRepairs = repairs.filter(r => r.status === "done");

  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>維修進程管理</title>
      </Helmet>
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold d-flex align-items-center gap-2">
            <BuildIcon className="text-primary" />
            維修進程管理
          </h1>
        </div>
        <div className="col-auto">
          <small className="text-muted d-flex align-items-center gap-2">
            <CalendarTodayIcon className="text-muted" />
            {new Date().toLocaleDateString('zh-TW')}
          </small>
        </div>
      </div>

      {/* 新增維修紀錄表單 */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h2 className="card-title h5 fw-semibold mb-3 d-flex align-items-center gap-2">
            <AddIcon className="text-primary" />
            新增維修紀錄
          </h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <DirectionsCarIcon className="text-muted" />
                車輛
              </label>
              <select className="form-select" name="vehicleId" value={form.vehicleId} onChange={handleFormChange} required>
                <option value="">請選擇車輛</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <BuildIcon className="text-muted" />
                維修項目
              </label>
              <input className="form-control" name="item" value={form.item} onChange={handleFormChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <LocationOnIcon className="text-muted" />
                地點
              </label>
              <input className="form-control" name="location" value={form.location} onChange={handleFormChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <CalendarTodayIcon className="text-muted" />
                維修日期
              </label>
              <input type="date" className="form-control" name="date" value={form.date} onChange={handleFormChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <BuildIcon className="text-muted" />
                料號
              </label>
              <input className="form-control" name="partNumber" value={form.partNumber} onChange={handleFormChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <AttachMoneyIcon className="text-muted" />
                費用
              </label>
              <input type="number" step="0.01" className="form-control" name="cost" value={form.cost} onChange={handleFormChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <CheckCircleIcon className="text-muted" />
                狀態
              </label>
              <select className="form-select" name="status" value={form.status} onChange={handleFormChange} required>
                <option value="pending">待處理</option>
                <option value="done">已完成</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label d-flex align-items-center gap-2">
                <AttachFileIcon className="text-muted" />
                發票/照片
              </label>
              <input type="file" className="form-control" name="invoiceFile" accept="image/*,application/pdf" onChange={handleFormChange} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary d-flex align-items-center gap-2" type="submit" disabled={submitting}>
                <SaveIcon />
                {submitting ? "新增中..." : "新增維修紀錄"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 維修狀態總覽與花費彙總 */}
      <div className="row mb-4">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-subtitle h6 fw-medium mb-3 d-flex align-items-center gap-2">
                <PendingIcon className="text-warning" />
                待處理維修
              </h3>
              {pendingRepairs.length === 0 ? (
                <div className="text-muted">尚無待處理項目</div>
              ) : (
                <ul className="list-group">
                  {pendingRepairs.map(r => (
                    <li className="list-group-item" key={r.id}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{vehicles.find(v => v.id === r.vehicleId)?.plateNumber || "未知車輛"}</strong> - {r.item}（{r.location}）<br />
                          <small className="text-muted">{r.date} | 費用: ${r.cost} | 料號: {r.partNumber}</small>
                          {r.invoiceUrl && <><br /><a href={r.invoiceUrl} target="_blank" rel="noopener noreferrer">發票/照片</a></>}
                        </div>
                        <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-2" onClick={() => handleStatusToggle(r.id, r.status)}>
                          <CheckCircleIcon />
                          標記完成
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-subtitle h6 fw-medium mb-3 d-flex align-items-center gap-2">
                <CheckCircleIcon className="text-success" />
                已完成維修
              </h3>
              {doneRepairs.length === 0 ? (
                <div className="text-muted">尚無已完成項目</div>
              ) : (
                <ul className="list-group">
                  {doneRepairs.map(r => (
                    <li className="list-group-item" key={r.id}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{vehicles.find(v => v.id === r.vehicleId)?.plateNumber || "未知車輛"}</strong> - {r.item}（{r.location}）<br />
                          <small className="text-muted">{r.date} | 費用: ${r.cost} | 料號: {r.partNumber}</small>
                          {r.invoiceUrl && <><br /><a href={r.invoiceUrl} target="_blank" rel="noopener noreferrer">發票/照片</a></>}
                        </div>
                        <button className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2" onClick={() => handleStatusToggle(r.id, r.status)}>
                          <PendingIcon />
                          標記待處理
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 各車輛總花費彙總 */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h2 className="card-title h5 fw-semibold mb-4">各車輛總花費</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">車牌號碼</th>
                  <th scope="col">品牌/型號</th>
                  <th scope="col">總花費</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td>{v.plateNumber || '未設定'}</td>
                    <td>{v.brand} {v.model}</td>
                    <td>${vehicleCostMap[v.id] ? vehicleCostMap[v.id].toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
  