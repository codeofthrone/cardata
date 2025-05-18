import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { config } from '../config';

const AuthContext = createContext();

// Retrieve user's company information from Firestore
// 直接使用用戶的 uid 獲取用戶文檔，避免權限問題
// 這種方法更安全，因為 Firestore 安全規則通常允許用戶讀取自己的文檔
// Modify the fetchUserByEmail function to handle permission errors gracefully
const fetchUserByEmail = async (userEmail, userId) => {
  try {
    // 創建查詢以根據email字段查找用戶
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    
    // 檢查是否有匹配的文檔
    if (!querySnapshot.empty) {
      // 取第一個匹配的文檔
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // 返回用戶信息，包含角色、公司和郵箱
      return {
        id: userDoc.id,
        exists: true,
        company: userData.company || "",
        role: userData.role || config.dashboard.defaultRole || "C",
        email: userData.email,
        data: userData
      };
    } else {
      // 沒有找到用戶記錄，創建新用戶
      try {
        const newUserData = {
          email: userEmail,
          role: "B", // 默認使用B角色
          company: "",
          createdAt: new Date().toISOString()
        };
        
        // 使用用戶的uid作為文檔ID
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, newUserData);
        
        return {
          id: userId,
          exists: true,
          company: "",
          role: "C",
          email: userEmail,
          data: newUserData
        };
      } catch (error) {
        console.error("創建新用戶時出錯:", error);
        // 如果創建失敗，返回默認值
        return {
          id: userId || "unknown",
          exists: false,
          company: "",
          role: "C", // 默認使用B角色
          email: userEmail,
          data: null
        };
      }
    }
  } catch (error) {
    console.error("查詢用戶資料出錯:", error);
    
    // 處理權限錯誤 - 返回預設值而不拋出錯誤
    if (error.code === "permission-denied" || 
        error.message.includes("Missing or insufficient permissions")) {
      console.log("權限不足，使用預設角色C繼續");
      return {
        id: userId || "unknown",
        exists: false,
        company: "",
        role: "C", // 預設使用C角色
        email: userEmail,
        data: null,
        permissionError: true
      };
    }
    
    // 對於其他錯誤，也返回預設值但標記不同錯誤類型
    return {
      id: userId || "unknown",
      exists: false,
      company: "",
      role: config.dashboard.defaultRole || "C",
      email: userEmail,
      data: null,
      otherError: true
    };
  }
};

export function useAuth() {
  return useContext(AuthContext);
}
/**
 * Authentication Provider Component
 * Manages user authentication state and provides auth-related functions to the app
 * @param {Object} children - Child components to be wrapped with auth context
 */
export function AuthProvider({ children }) {
  // Track current authenticated user with additional custom properties
  const [currentUser, setCurrentUser] = useState(null);
  // Track loading state during authentication operations
  const [loading, setLoading] = useState(true);

  /**
   * Authenticates a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Firebase auth promise
   */
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Signs out the current user
   * @returns {Promise} Firebase signOut promise
   */
  function logout() {
    return signOut(auth);
  }

  // Set up authentication state observer
  useEffect(() => {
    // Subscribe to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Set loading state at the start
      
      try {
        // Case 1: No user but auto-login is enabled in config
        if (!user && config.auth.skipLogin) {
          try {
            await login(config.auth.defaultEmail, config.auth.defaultPassword);
            return; // Let the next auth state change handle the user setup
          } catch (error) {
            console.error('Auto login failed:', error);
          }
        }
        // Case 2: User is authenticated
        else if (user) {
          console.log("正在通過郵箱查詢用戶:", user.email);
          const userResult = await fetchUserByEmail(user.email, user.uid);
          console.log("用戶查詢結果:", userResult);


          // Case 2A: User document exists in Firestore
          if (userResult.exists) {
            // 獲取用戶資料
            const userData = userResult.data;
            const userRole = userData.role !== undefined ? userData.role : (config.dashboard.defaultRole || "C");
            const userCompany = userData.company || "";

            setCurrentUser({
              ...user,
              company: userCompany,
              role: userRole,
              userData: userData
            });

            console.log("用戶登入成功 - 詳細信息:");
            console.log("Email:", user.email);
            console.log("Role:", userRole);
            console.log("Company:", userCompany);
            console.log("User document exists, user data:", userData);
          } else {
            // 用戶記錄不存在，創建新用戶
            console.log("沒有找到郵箱匹配的用戶記錄，創建新用戶");
            const defaultUserData = {
              email: user.email,
              displayName: user.displayName || "",
              company: "",
              role: config.dashboard.defaultRole || "C",
              createdAt: new Date().toISOString()
            };

            // 寫入新用戶記錄到 Firestore
            try {
              // 可以使用用戶的 uid 或生成新的 ID
              const userDocRef = doc(db, "users", user.uid);
              await setDoc(userDocRef, defaultUserData);
              console.log("成功創建用戶文檔");

              const userRole = defaultUserData.role;
              const userCompany = defaultUserData.company;

              setCurrentUser({
                ...user,
                company: defaultUserData.company,
                role: defaultUserData.role,
                userData: defaultUserData
              });

              console.log("新用戶創建成功 - 詳細信息:");
              console.log("Email:", user.email);
              console.log("Role:", userRole);
              console.log("Company:", userCompany);
            } catch (error) {
              console.error("無法創建用戶文檔:", error);
              setCurrentUser({
                ...user,
                company: "",
                role: config.dashboard.defaultRole || "C",
                userData: defaultUserData,
                isDefaultRole: true // 標記這是使用默認角色
              });
            }
          }
        }
        // Case 3: No authenticated user
        else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        // 如果發生錯誤，使用基本用戶信息並設置默認角色
        if (user) {
          setCurrentUser({
            ...user,
            company: "",
            role: config.dashboard.defaultRole || "C",
            userData: null,
            isDefaultRole: true // 標記這是使用默認角色
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    });

    // Clean up subscription when component unmounts
    return unsubscribe;
  }, []);

  // Context value object containing authentication state and functions
  const value = {
    currentUser,
    login,
    logout,
    /**
     * Utility function to get a user's company information on demand
     * @param {string} userEmail - Firebase user email
     * @returns {Promise<string>} Company name or empty string
     */
    getUserCompany: async (userEmail) => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return userDoc.data().company || "";
        }
        return "";
      } catch (error) {
        console.error("Failed to get user company information:", error);
        return "";
      }
    }
  };

  // Render the context provider with all authentication values
  // Only render children once authentication loading is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}