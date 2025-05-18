import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import DashboardA from './pages/DashboardA';
import DashboardB from './pages/DashboardB';
import DashboardC from './pages/DashboardC';
import AppIcons from './components/AppIcons';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { config } from './config';
import { useState, useEffect } from 'react';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  // 使用用戶的role屬性作為初始值，如果沒有則使用config中的defaultRole
  const [role, setRole] = useState(() => {
    return currentUser?.role || config.dashboard.defaultRole;
  });

  // 切換角色的功能
  const switchRole = (newRole) => {
    setRole(newRole);
  };

  // 當用戶信息更新時，更新角色
  useEffect(() => {
    if (currentUser?.role) {
      setRole(currentUser.role);
    } else if (currentUser && currentUser.uid) {
      // 如果用戶存在但角色缺失，設置默認角色
      console.log(`用戶 ${currentUser.uid} 已登入，但角色數據缺失，使用默認角色`);
      setRole(config.dashboard.defaultRole);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            {/* 車輛管理系統 */}
            <div className="d-flex align-items-center">
              <DirectionsCarIcon className="text-primary me-2" />
              <span className="h5 mb-0 fw-bold">車輛管理系統</span>
            </div>
            
            {/* 角色切換按鈕 */}
            {!config.dashboard.hideRoleSwitcher && (
              <div className="btn-group mx-3">
                <button 
                  className={`btn ${role === "A" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => switchRole("A")}
                >
                  入庫介面
                </button>
                <button 
                  className={`btn ${role === "B" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => switchRole("B")}
                >
                  維修介面
                </button>
                <button 
                  className={`btn ${role === "C" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => switchRole("C")}
                >
                  總覽介面
                </button>
              </div>
            )}
            
            {/* 登出按鈕 */}
            <button
              onClick={logout}
              className="btn btn-danger"
            >
              登出
            </button>
          </div>
        </div>
      </nav>
      
      <div className="py-4">
        {config.dashboard.showAll ? (
          <div className="container">
            <div className="mb-4">
              <h2 className="h5 mb-3">入庫介面</h2>
              <DashboardA />
            </div>
            <div className="mb-4">
              <h2 className="h5 mb-3">維修介面</h2>
              <DashboardB />
            </div>
            <div className="mb-4">
              <h2 className="h5 mb-3">總覽介面</h2>
              <DashboardC />
            </div>
          </div>
        ) : (
          <div className="container">
            {role === "A" && <DashboardA />}
            {role === "B" && <DashboardB />}
            {role === "C" && <DashboardC />}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppContent />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;