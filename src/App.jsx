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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">歡迎使用系統</h1>
          <p className="text-sm text-gray-600">
            {user.email} - 權限: {role || "未知"} (UID: {user.uid})
          </p>
        </div>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleLogout}
        >
          登出
        </button>
      </div>
      {role === "A" && <DashboardA />}
      {role === "B" && <DashboardB />}
      {role === "C" && <DashboardC />}
    </div>
  );
}

export default App;