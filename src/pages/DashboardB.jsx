import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
import { 
  addVehicleRepairPart, 
  getAllVehicleRepairParts, 
  updateVehicleRepairPartStatus,
  updateVehicleRepairPart,
  calculateVehicleRepairCosts,
  uploadRepairInvoiceFile 
} from "../utils/firestoreVehicleRepairs";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc, 
  setDoc, 
  addDoc,
  orderBy 
} from "firebase/firestore";
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
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import CategoryIcon from '@mui/icons-material/Category';
import { Timestamp } from "firebase/firestore";

export default function DashboardB() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(""); // 修改為空字符串，初始顯示全部（不篩選狀態）
  const [brandFilter, setBrandFilter] = useState(""); // 新增品牌篩選
  const [modelFilter, setModelFilter] = useState(""); // 新增型號篩選
  const [brands, setBrands] = useState([]); // 儲存可篩選的品牌列表
  const [models, setModels] = useState([]); // 儲存可篩選的型號列表
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
  const [showRepairListModal, setShowRepairListModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingRepairIndex, setEditingRepairIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // 修改名稱，使其更通用
  const [repairPartsList, setRepairPartsList] = useState([]);

  // 取得車輛清單
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const vehiclesRef = collection(db, "vehicles");
        
        // 獲取用戶公司資訊 - 使用與其他模組一致的方法
        let userCompany = "";
        if (currentUser) {
          // 首先嘗試從 currentUser 物件獲取公司資訊
          if (currentUser.company) {
            userCompany = currentUser.company;
            console.log("從 currentUser 獲取用戶公司:", userCompany);
          } else {
            // 如果 currentUser 沒有公司資訊，則查詢資料庫（使用email）
            try {
              const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", currentUser.email)));
              if (!userDoc.empty) {
                userCompany = userDoc.docs[0].data().company || "";
                console.log("從資料庫查詢獲取用戶公司:", userCompany);
              } else {
                console.log("未找到用戶文檔，將使用空公司名稱");
              }
            } catch (err) {
              console.error("獲取用戶公司信息時出錯:", err);
              // 不設置錯誤，繼續使用空公司名稱
            }
          }
        }

        // 修改車輛獲取邏輯：先獲取所有車輛，然後在客戶端進行公司篩選
        const vehiclesQuery = query(
          vehiclesRef,
          orderBy("createdAt", "desc") // 確保有一致的排序
        );
        
        const snapshot = await getDocs(vehiclesQuery);
        let vehicleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 如果用戶有公司資訊，則只顯示該公司的車輛
        if (userCompany) {
          vehicleData = vehicleData.filter(vehicle => vehicle.company === userCompany);
        }
        
        console.log(`獲取到 ${vehicleData.length} 筆車輛資料，公司: ${userCompany}`, vehicleData);
        
        // 提取品牌和型號用於篩選
        const uniqueBrands = [...new Set(vehicleData.map(v => v.brand).filter(Boolean))];
        const uniqueModels = [...new Set(vehicleData.map(v => v.model).filter(Boolean))];
        
        setBrands(uniqueBrands);
        setModels(uniqueModels);
        setVehicles(vehicleData);
        setFilteredVehicles(vehicleData); // 初始化過濾列表

        // 將所有車輛的 repairParts 扁平化到 repairs 狀態中
        const allRepairs = [];
        vehicleData.forEach(vehicle => {
          if (vehicle.repairParts && Array.isArray(vehicle.repairParts)) {
            vehicle.repairParts.forEach(part => {
              allRepairs.push({
                id: part.id || `${vehicle.id}-${Math.random().toString(36).substr(2, 9)}`, // Fallback ID if not present
                item: part.part || part.item || '', // 將 Firestore 的 'part' 映射到 'item'，並提供 fallback
                location: part.location || '',
                date: part.date || '',
                partNumber: part.partNumber || '',
                cost: parseFloat(part.cost) || 0,
                status: (part.status === 'done') ? 'done' : 'pending', // 確保 status 總是 'pending' 或 'done'
                invoiceUrl: part.invoiceUrl || '',
                userId: part.userId || '',
                createdAt: (part.createdAt instanceof Timestamp) ? part.createdAt : null,
                updatedAt: (part.updatedAt instanceof Timestamp) ? part.updatedAt : null,
                vehicleId: vehicle.id,
              });
            });
          }
        });
        setRepairs(allRepairs);
        console.log(`扁平化後獲取到 ${allRepairs.length} 筆維修記錄`);
        console.log("扁平化後維修記錄詳細資料:", allRepairs);
      } catch (error) {
        console.error("獲取車輛資料時出錯:", error);
        setError("獲取車輛資料時出錯");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [currentUser]);

  // 處理搜尋和篩選功能
  useEffect(() => {
    let filtered = vehicles;
    
    // 預設過濾掉已售出的車輛
    filtered = filtered.filter(vehicle => !vehicle.sold);
    
    // 應用搜尋篩選（擴展為搜尋車牌、品牌和型號）
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vehicle => 
        (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(term)) ||
        (vehicle.brand && vehicle.brand.toLowerCase().includes(term)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(term))
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
    
    // 添加過濾後的數據輸出
    console.log("過濾後的車輛資料:", filtered);
    console.log("過濾條件:", {
      searchTerm: searchTerm.trim(),
      statusFilter,
      brandFilter,
      modelFilter,
      hideSold: true
    });
    
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, brandFilter, modelFilter, vehicles]);

  // 獲取維修部位列表
  useEffect(() => {
    const fetchRepairPartsList = async () => {
      try {
        const optionsRef = doc(db, "settings", "options");
        const optionsDoc = await getDoc(optionsRef);
        
        if (optionsDoc.exists()) {
          const optionsData = optionsDoc.data();
          
          // 設置維修部位選項
          if (optionsData.repairParts && Array.isArray(optionsData.repairParts)) {
            setRepairPartsList(optionsData.repairParts);
          } else {
            // 默認維修部位選項
            const defaultRepairParts = [
              "引擎", "變速箱", "煞車系統", "懸吊系統", "輪胎",
              "電瓶", "冷氣系統", "車身鈑金", "烤漆", "電系",
              "底盤", "傳動系統", "排氣系統", "其他"
            ];
            setRepairPartsList(defaultRepairParts);
            // 保存默認維修部位到Firestore
            await updateDoc(optionsRef, { repairParts: defaultRepairParts });
          }
        } else {
          // 如果文檔不存在，創建它並設置默認值
          const defaultRepairParts = [
            "引擎", "變速箱", "煞車系統", "懸吊系統", "輪胎",
            "電瓶", "冷氣系統", "車身鈑金", "烤漆", "電系",
            "底盤", "傳動系統", "排氣系統", "其他"
          ];
          await setDoc(optionsRef, { repairParts: defaultRepairParts });
          setRepairPartsList(defaultRepairParts);
        }
      } catch (error) {
        console.error("獲取維修部位列表時出錯:", error);
        // 設置默認值
        const defaultRepairParts = [
          "引擎", "變速箱", "煞車系統", "懸吊系統", "輪胎",
          "電瓶", "冷氣系統", "車身鈑金", "烤漆", "電系",
          "底盤", "傳動系統", "排氣系統", "其他"
        ];
        setRepairPartsList(defaultRepairParts);
      }
    };
    
    fetchRepairPartsList();
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
          // 使用新的上傳函數，會自動建立車輛特定的路徑
          invoiceUrl = await uploadRepairInvoiceFile(form.invoiceFile, form.vehicleId);
        } catch (error) {
          console.error("上傳檔案失敗:", error);
          setError(error.message || "上傳檔案失敗，請重試");
          setSubmitting(false);
          return;
        }
      }

      // 使用新的函數新增維修部件到車輛子集合
      await addVehicleRepairPart(form.vehicleId, {
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

      // 重新取得所有車輛資料，這會觸發 `useEffect` 更新 `repairs` 狀態
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(vehiclesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(vehiclesQuery);
      let vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 如果用戶有公司資訊，則只顯示該公司的車輛
      if (currentUser.company) {
        vehicleData = vehicleData.filter(vehicle => vehicle.company === currentUser.company);
      }
      setVehicles(vehicleData);

      // 重新取得維修紀錄 - 現在由 `fetchVehicles` 處理，但為了確保立即更新，可以在這裡觸發一次
      // 重新觸發 useEffect 中的邏輯來更新 repairs 狀態
      const allRepairs = [];
      vehicleData.forEach(vehicle => {
        if (vehicle.repairParts && Array.isArray(vehicle.repairParts)) {
          vehicle.repairParts.forEach(part => {
            allRepairs.push({
              ...part,
              vehicleId: vehicle.id, // 添加 vehicleId 連結
              id: part.id || `${vehicle.id}-${Math.random().toString(36).substr(2, 9)}` // Fallback ID if not present
            });
          });
        }
      });
      setRepairs(allRepairs);

    } catch (err) {
      console.error("新增維修紀錄失敗:", err);
      setError(err.message || "新增維修紀錄失敗");
    } finally {
      setSubmitting(false);
    }
  };

  // 切換維修狀態
  const handleStatusToggle = async (repairId, currentStatus, vehicleId) => {
    try {
      const newStatus = currentStatus === "pending" ? "done" : "pending";
      await updateVehicleRepairPartStatus(vehicleId, repairId, newStatus);
      
      // 重新取得所有車輛資料，這會觸發 `useEffect` 更新 `repairs` 狀態
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(vehiclesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(vehiclesQuery);
      let vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 如果用戶有公司資訊，則只顯示該公司的車輛
      if (currentUser.company) {
        vehicleData = vehicleData.filter(vehicle => vehicle.company === currentUser.company);
      }
      setVehicles(vehicleData);

      // 重新觸發 useEffect 中的邏輯來更新 repairs 狀態
      const allRepairs = [];
      vehicleData.forEach(vehicle => {
        if (vehicle.repairParts && Array.isArray(vehicle.repairParts)) {
          vehicle.repairParts.forEach(part => {
            allRepairs.push({
              ...part,
              vehicleId: vehicle.id, // 添加 vehicleId 連結
              id: part.id || `${vehicle.id}-${Math.random().toString(36).substr(2, 9)}` // Fallback ID if not present
            });
          });
        }
      });
      setRepairs(allRepairs);

    } catch (error) {
      console.error("更新維修狀態失敗:", error);
      setError("更新維修狀態失敗");
    }
  };

  /**
   * 切換付款狀態（實際上是切換維修狀態，done=已付款，pending=未付款）
   * @param {string} repairId - 維修記錄ID
   * @param {string} currentStatus - 目前狀態
   * @param {string} vehicleId - 車輛ID
   * @param {string} item - 維修項目 (用於識別舊資料)
   * @param {number} cost - 費用 (用於識別舊資料)
   */
  const handlePaymentStatusToggle = async (repairId, currentStatus, vehicleId, item, cost) => {
    try {
      const newStatus = currentStatus === "pending" ? "done" : "pending";
      await updateVehicleRepairPartStatus(vehicleId, repairId, newStatus, item, cost);
      
      // 重新取得所有車輛資料，這會觸發 `useEffect` 更新 `repairs` 狀態
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(vehiclesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(vehiclesQuery);
      let vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 如果用戶有公司資訊，則只顯示該公司的車輛
      if (currentUser.company) {
        vehicleData = vehicleData.filter(vehicle => vehicle.company === currentUser.company);
      }
      setVehicles(vehicleData);

      // 重新觸發 useEffect 中的邏輯來更新 repairs 狀態
      const allRepairs = [];
      vehicleData.forEach(vehicle => {
        if (vehicle.repairParts && Array.isArray(vehicle.repairParts)) {
          vehicle.repairParts.forEach(part => {
            allRepairs.push({
              ...part,
              vehicleId: vehicle.id, // 添加 vehicleId 連結
              id: part.id || `${vehicle.id}-${Math.random().toString(36).substr(2, 9)}` // Fallback ID if not present
            });
          });
        }
      });
      setRepairs(allRepairs);

      // 直接更新 selectedVehicle 的 repairParts 狀態以立即更新 UI
      if (selectedVehicle && selectedVehicle.repairParts) {
        const updatedRepairParts = selectedVehicle.repairParts.map(repair => 
          repair.id === repairId ? { ...repair, status: newStatus } : repair
        );
        setSelectedVehicle({
          ...selectedVehicle,
          repairParts: updatedRepairParts,
          // 重新計算總金額以反映狀態變化，如果需要
          totalRepairCost: updatedRepairParts.reduce((sum, part) => sum + (parseFloat(part.cost) || 0), 0)
        });
        console.log("Selected Vehicle Repair Parts after update:", updatedRepairParts); // Debugging log

        // 同步更新主 repairs 狀態 (如果需要，可考慮更優化的更新方式)
        setRepairs(prevRepairs => {
          const newRepairs = prevRepairs.map(r => 
            (r.vehicleId === vehicleId && r.id === repairId) ? { ...r, status: newStatus } : r
          );
          console.log("Global Repairs state after update:", newRepairs); // Debugging log
          return newRepairs;
        });
      }

    } catch (error) {
      console.error("更新付款狀態失敗:", error);
      setError("更新付款狀態失敗");
    }
  };

  // 彙總每台車輛的總花費
  const calculateVehicleCosts = () => {
    console.log("calculateVehicleCosts is running."); // Debugging log
    const costs = {};
    
    // 初始化所有車輛的成本對象
    vehicles.forEach(vehicle => {
      costs[vehicle.id] = {
        paidCost: 0,    // 已付款金額
        unpaidCost: 0,  // 未付款金額
        totalCost: 0    // 總金額
      };
    });

    // 使用新的資料結構計算維修記錄中的費用
    repairs.forEach(repair => {
      if (costs[repair.vehicleId]) {
        const cost = parseFloat(repair.cost) || 0;
        if (repair.status === "done") {
          costs[repair.vehicleId].paidCost += cost;
        } else {
          costs[repair.vehicleId].unpaidCost += cost;
        }
      }
    });

    // 計算總費用
    Object.keys(costs).forEach(vehicleId => {
      costs[vehicleId].totalCost = costs[vehicleId].paidCost + costs[vehicleId].unpaidCost;
    });

    return costs;
  };

  const vehicleCosts = calculateVehicleCosts();

  // 狀態分類
  const pendingRepairs = repairs.filter(r => r.status === "pending");
  const doneRepairs = repairs.filter(r => r.status === "done");

  // 處理車牌點擊
  const handlePlateClick = (vehicle) => {
    // 取得該車輛的所有維修記錄
    const vehicleRepairs = repairs.filter(repair => repair.vehicleId === vehicle.id);
    
    // 將維修記錄轉換為 repairParts 格式以便在模態框中顯示
    const repairParts = vehicleRepairs.map(repair => ({
      id: repair.id,
      item: repair.part || repair.item || '', // 修正：從 Firestore 的 'part' 欄位取得維修項目名稱，並提供 fallback
      location: repair.location || '',
      date: repair.date || '',
      partNumber: repair.partNumber || '',
      cost: parseFloat(repair.cost) || 0,
      status: repair.status
    }));
    
    // 計算總維修費用
    const totalRepairCost = repairParts.reduce((sum, part) => sum + part.cost, 0);
    
    const vehicleWithRepairs = {
      ...vehicle,
      repairParts: repairParts,
      totalRepairCost: totalRepairCost
    };
    
    setSelectedVehicle(vehicleWithRepairs);
    setShowRepairListModal(true);
  };

  // 處理維修項目編輯
  const handleEditRepair = (index) => {
    setEditingRepairIndex(index);
  };

  // 處理維修項目更新
  const handleUpdateRepair = async (index, field, value) => {
    if (!selectedVehicle || !selectedVehicle.repairParts || !selectedVehicle.repairParts[index]) return;

    try {
      const repairPart = selectedVehicle.repairParts[index];
      const updatedValue = field === 'cost' ? parseFloat(value) || 0 : value;
      
      // Prepare updateData based on the field being updated
      const updateDataForFirestore = { [field]: updatedValue };
      
      // If updating 'item', ensure the 'part' field in Firestore is updated
      if (field === 'item') {
        updateDataForFirestore.part = updatedValue; // Map 'item' to 'part' for Firestore
      }

      // 如果這個維修部件有對應的 Firestore 文檔 ID，則更新子集合
      if (repairPart.id) {
        await updateVehicleRepairPart(selectedVehicle.id, repairPart.id, updateDataForFirestore, { item: repairPart.item, cost: repairPart.cost }); // Pass item and cost
      } else {
        // If no ID, use identifying properties for legacy data
        await updateVehicleRepairPart(selectedVehicle.id, null, updateDataForFirestore, { item: repairPart.item, cost: repairPart.cost }); // Pass item and cost
      }

      // After successful update, re-fetch all vehicle data to ensure UI is in sync
      const vehiclesRef = collection(db, "vehicles");
      const vehiclesQuery = query(vehiclesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(vehiclesQuery);
      let vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 如果用戶有公司資訊，則只顯示該公司的車輛
      if (currentUser.company) {
        vehicleData = vehicleData.filter(vehicle => vehicle.company === currentUser.company);
      }
      setVehicles(vehicleData);

      // 重新觸發 useEffect 中的邏輯來更新 repairs 狀態
      const allRepairs = [];
      vehicleData.forEach(vehicle => {
        if (vehicle.repairParts && Array.isArray(vehicle.repairParts)) {
          vehicle.repairParts.forEach(part => {
            allRepairs.push({
              ...part,
              vehicleId: vehicle.id, // 添加 vehicleId 連結
              id: part.id || `${vehicle.id}-${Math.random().toString(36).substr(2, 9)}` // Fallback ID if not present
            });
          });
        }
      });
      setRepairs(allRepairs);
      
      // 重新取得車輛資料以更新選中的車輛 (此部分將在重新獲取所有車輛後自動更新)
      // const vehiclesRef = collection(db, "vehicles");
      // const vehiclesSnapshot = await getDocs(vehiclesRef);
      // const updatedVehicles = vehiclesSnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // }));
      // setVehicles(updatedVehicles);
      
      // 更新選中的車輛資料
      const updatedSelectedVehicle = vehicleData.find(v => v.id === selectedVehicle.id);
      if (updatedSelectedVehicle) {
        // 重新應用與 handlePlateClick 相同的映射，以確保模態框顯示一致性
        const updatedModalRepairParts = updatedSelectedVehicle.repairParts.map(repair => ({
          id: repair.id,
          item: repair.part || repair.item || '', // 修正：從 Firestore 的 'part' 欄位取得維修項目名稱，並提供 fallback
          location: repair.location || '',
          date: repair.date || '',
          partNumber: repair.partNumber || '',
          cost: parseFloat(repair.cost) || 0,
          status: repair.status
        }));

        setSelectedVehicle({
          ...updatedSelectedVehicle,
          repairParts: updatedModalRepairParts,
          totalRepairCost: updatedModalRepairParts.reduce((sum, part) => sum + part.cost, 0)
        });
      }

      setEditingRepairIndex(null);
    } catch (error) {
      console.error("更新維修項目時出錯:", error);
      alert(`更新失敗: ${error.message}`);
    }
  };

  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>維修進程管理</title>
      </Helmet>
      {/* <div className="row mb-4 align-items-center">
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
      </div> */}

      {/* 車輛維修列表與總花費 */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h2 className="card-title h5 fw-semibold mb-3 d-flex align-items-center gap-2">
            <DirectionsCarIcon className="text-primary" />
            車輛維修列表與費用
          </h2>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="搜尋車牌號碼、品牌或型號"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
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
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>車牌號碼</th>
                  <th>品牌</th>
                  <th>車型</th>
                  <th>維修項目數</th>
                  <th>已付款</th>
                  <th>未付款</th>
                  <th>總金額</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const vehicleRepairCount = repairs.filter(r => r.vehicleId === vehicle.id).length;
                  
                  // 為車輛 2576-BUU 添加除錯資訊
                  if (vehicle.plateNumber === '2576-BUU') {
                    console.log(`車輛 ${vehicle.plateNumber} (ID: ${vehicle.id}) 的維修記錄數量:`, vehicleRepairCount);
                    console.log(`該車輛相關的維修記錄:`, repairs.filter(r => r.vehicleId === vehicle.id));
                  }
                  
                  return (
                  <tr key={vehicle.id}>
                    <td>
                      <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => handlePlateClick(vehicle)}
                      >
                        {vehicle.plateNumber}
                      </button>
                    </td>
                    <td>{vehicle.brand}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicleRepairCount}</td>
                    <td className="text-success">NT$ {vehicleCosts[vehicle.id]?.paidCost.toLocaleString() || 0}</td>
                    <td className="text-danger">NT$ {vehicleCosts[vehicle.id]?.unpaidCost.toLocaleString() || 0}</td>
                    <td className="fw-bold">NT$ {vehicleCosts[vehicle.id]?.totalCost.toLocaleString() || 0}</td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="table-light">
                  <td colSpan="4" className="text-end fw-bold">總計：</td>
                  <td className="text-success fw-bold">
                    NT$ {Object.values(vehicleCosts).reduce((sum, cost) => sum + cost.paidCost, 0).toLocaleString()}
                  </td>
                  <td className="text-danger fw-bold">
                    NT$ {Object.values(vehicleCosts).reduce((sum, cost) => sum + cost.unpaidCost, 0).toLocaleString()}
                  </td>
                  <td className="fw-bold">
                    NT$ {Object.values(vehicleCosts).reduce((sum, cost) => sum + cost.totalCost, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 維修項目列表 Modal */}
      {showRepairListModal && selectedVehicle && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  維修項目列表 - {selectedVehicle.plateNumber}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowRepairListModal(false);
                    setSelectedVehicle(null);
                    setEditingRepairIndex(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>維修部位</th>
                        <th>地點</th>
                        <th>維修日期</th>
                        <th>料號</th>
                        <th>金額</th>
                        <th>付款狀態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVehicle.repairParts && selectedVehicle.repairParts.length > 0 ? (
                        selectedVehicle.repairParts.map((repair, index) => {
                          console.log(`Modal Repair Part ${index}:`, repair); // Debugging log
                          return (
                          <tr key={index}>
                            <td>
                              {editingRepairIndex === index ? (
                                <input
                                  type="text"
                                  className="form-control"
                                  list={`editRepairPartsList-${index}`}
                                  value={repair.item}
                                  onChange={(e) => handleUpdateRepair(index, 'item', e.target.value)}
                                />
                              ) : (
                                repair.item
                              )}
                              <datalist id={`editRepairPartsList-${index}`}>
                                {repairPartsList.map((part) => (
                                  <option key={part} value={part}>
                                    {part}
                                  </option>
                                ))}
                              </datalist>
                            </td>
                            <td>
                              {editingRepairIndex === index ? (
                                <input
                                  type="text"
                                  className="form-control"
                                  value={repair.location}
                                  onChange={(e) => handleUpdateRepair(index, 'location', e.target.value)}
                                />
                              ) : (
                                repair.location
                              )}
                            </td>
                            <td>
                              {editingRepairIndex === index ? (
                                <input
                                  type="date"
                                  className="form-control"
                                  value={repair.date}
                                  onChange={(e) => handleUpdateRepair(index, 'date', e.target.value)}
                                />
                              ) : (
                                repair.date
                              )}
                            </td>
                            <td>
                              {editingRepairIndex === index ? (
                                <input
                                  type="text"
                                  className="form-control"
                                  value={repair.partNumber}
                                  onChange={(e) => handleUpdateRepair(index, 'partNumber', e.target.value)}
                                />
                              ) : (
                                repair.partNumber
                              )}
                            </td>
                            <td>
                              {editingRepairIndex === index ? (
                                <input
                                  type="number"
                                  className="form-control"
                                  value={repair.cost}
                                  onChange={(e) => handleUpdateRepair(index, 'cost', e.target.value)}
                                />
                              ) : (
                                `NT$ ${repair.cost.toLocaleString()}`
                              )}
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${repair.status === 'done' ? 'btn-success' : 'btn-outline-warning'}`}
                                onClick={() => handlePaymentStatusToggle(repair.id, repair.status, selectedVehicle.id, repair.item, repair.cost)}
                                disabled={editingRepairIndex === index}
                              >
                                {repair.status === 'done' ? '已付款' : '未付款'}
                              </button>
                            </td>
                            <td>
                              {editingRepairIndex === index ? (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => setEditingRepairIndex(null)}
                                >
                                  完成
                                </button>
                              ) : (
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleEditRepair(index)}
                                >
                                  <EditIcon fontSize="small" />
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            該車輛目前沒有維修記錄
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">已付款：</td>
                        <td className="fw-bold text-success">
                          NT$ {(selectedVehicle.repairParts?.filter(r => r.status === 'done').reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0) || 0).toLocaleString()}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">未付款：</td>
                        <td className="fw-bold text-warning">
                          NT$ {(selectedVehicle.repairParts?.filter(r => r.status === 'pending').reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0) || 0).toLocaleString()}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">總金額：</td>
                        <td className="fw-bold">NT$ {selectedVehicle.totalRepairCost?.toLocaleString() || 0}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRepairListModal(false);
                    setSelectedVehicle(null);
                    setEditingRepairIndex(null);
                  }}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showRepairListModal) && (
        <div className="modal-backdrop fade show"></div>
      )}

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
              <input
                type="text"
                className="form-control"
                name="item"
                value={form.item}
                onChange={handleFormChange}
                list="repairPartsList"
                placeholder="請選擇或輸入維修項目"
                required
              />
              <datalist id="repairPartsList">
                {repairPartsList.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </datalist>
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
                          <strong>
                            <button
                              className="btn btn-link p-0 text-decoration-none"
                              onClick={() => handlePlateClick(vehicles.find(v => v.id === r.vehicleId))}
                            >
                              {vehicles.find(v => v.id === r.vehicleId)?.plateNumber || "未知車輛"}
                            </button>
                          </strong> - {r.item}（{r.location}）<br />
                          <small className="text-muted">{r.date} | 費用: ${r.cost} | 料號: {r.partNumber}</small>
                          {r.invoiceUrl && <><br /><a href={r.invoiceUrl} target="_blank" rel="noopener noreferrer">發票/照片</a></>}
                        </div>
                        <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-2" onClick={() => handleStatusToggle(r.id, r.status, r.vehicleId)}>
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
                          <strong>
                            <button
                              className="btn btn-link p-0 text-decoration-none"
                              onClick={() => handlePlateClick(vehicles.find(v => v.id === r.vehicleId))}
                            >
                              {vehicles.find(v => v.id === r.vehicleId)?.plateNumber || "未知車輛"}
                            </button>
                          </strong> - {r.item}（{r.location}）<br />
                          <small className="text-muted">{r.date} | 費用: ${r.cost} | 料號: {r.partNumber}</small>
                          {r.invoiceUrl && <><br /><a href={r.invoiceUrl} target="_blank" rel="noopener noreferrer">發票/照片</a></>}
                        </div>
                        <button className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2" onClick={() => handleStatusToggle(r.id, r.status, r.vehicleId)}>
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
    </div>
  );
}
