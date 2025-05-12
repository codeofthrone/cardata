import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import DashboardA from "./pages/DashboardA";
import DashboardB from "./pages/DashboardB";
import DashboardC from "./pages/DashboardC";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Add console log here to see user information when authenticated
        console.log("User authenticated:", {
          email: user.email,
          displayName: user.displayName,
          role: user.role
        });
        
        try {
          const q = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          console.log("Query:", q);
    
          const querySnapshot = await getDocs(q);
          console.log("Query snapshot:", querySnapshot);
          const docList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("User document:", docList[0].role);
          const userRole = docList[0].role;

          setRole(userRole);
        } catch (error) {
          console.error("Error getting user role:", error);
          setRole("C"); // Default to role C on error
        }
      } else {
        // User is signed out
        console.log("No user signed in");
        setRole(null);
      }
      
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      // Add console log here to confirm which user is logging out
      console.log("Logging out user:", user?.uid);
      
      await signOut(auth);
      setUser(null);
      setRole(null);
      // Clear role from localStorage on logout
      if (user && user.uid) {
        localStorage.removeItem(`user_role_${user.uid}`);
        console.log(`Removed role from localStorage for user: ${user.uid}`);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Save the new role to localStorage
    if (user && user.uid) {
      console.log(`Setting role ${newRole} for user: ${user.uid}`);
      localStorage.setItem(`user_role_${user.uid}`, newRole);
    } else {
      console.warn("Cannot save role: No user or user.uid available", {
        user, 
        newRole
      });
    }
  };

  // Add console log to show when the component renders with specific user and role
  useEffect(() => {
    if (user) {
      console.log("App rendering with:", {
        userId: user.uid,
        userEmail: user.email,
        role: user.role,
        currentRole: role
      });
    }
  }, [user, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleRoleChange} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">車輛管理系統</h1>
                <p className="text-sm text-gray-600">
                  {user.email} - 權限: {role || "未知"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {role === "A" ? "管理員" : role === "B" ? "維修人員" : "一般用戶"}
                </span>
              </div>
              <button
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                onClick={handleLogout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="py-4">
        {role === "A" && <DashboardA />}
        {role === "B" && <DashboardB />}
        {role === "C" && <DashboardC />}
      </div>
    </div>
  );
}

export default App;