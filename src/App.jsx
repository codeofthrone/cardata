import { useState } from "react";
import DashboardA from "./pages/DashboardA";
import DashboardB from "./pages/DashboardB";
import DashboardC from "./pages/DashboardC";

function App() {
  // 暫時移除登入系統，直接設定角色
  const [role, setRole] = useState("A"); // 預設顯示DashboardA
  
  // 切換角色的功能
  const switchRole = (newRole) => {
    setRole(newRole);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a className="flex items-center" href="#">
                <svg className="text-blue-600" width="32" height="32" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="ml-2 font-semibold text-gray-900">車輛管理系統</span>
              </a>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {role === "A" ? "管理員" : role === "B" ? "維修人員" : "一般用戶"}
                </span>
              </div>
              
              <div className="inline-flex rounded-md shadow-sm">
                <button 
                  className={`px-4 py-2 text-sm font-medium ${role === "A" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                  onClick={() => switchRole("A")}
                >
                  入庫介面
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium ${role === "B" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border-t border-b border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                  onClick={() => switchRole("B")}
                >
                  維修介面
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium ${role === "C" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                  onClick={() => switchRole("C")}
                >
                  總覽介面
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="py-6">
        {role === "A" && <DashboardA />}
        {role === "B" && <DashboardB />}
        {role === "C" && <DashboardC />}
      </div>
    </div>
  );
}

export default App;