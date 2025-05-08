import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDocs, query, where, collection } from "firebase/firestore";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    if (!email.trim()) {
      setError("請輸入電子郵件");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("電子郵件格式不正確");
      return;
    }
    
    // Validate password
    if (!password.trim()) {
      setError("請輸入密碼");
      return;
    }
    
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential); 
      // using userCredential email get user email
      // Try to get user document from Firestore
      // compare with firebase > users > email , get user role
      const user = userCredential.user;
      
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
      const setRole = docList[0].role;

      onLogin(setRole);
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      let errorMessage = "登入失敗";
      
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "電子郵件格式不正確";
          break;
        case "auth/user-disabled":
          errorMessage = "此帳號已被停用";
          break;
        case "auth/user-not-found":
          errorMessage = "無此用戶";
          break;
        case "auth/wrong-password":
          errorMessage = "密碼錯誤";
          break;
        case "auth/configuration-not-found":
          errorMessage = "Firebase設定錯誤，請聯絡系統管理員";
          break;
        default:
          errorMessage = `登入失敗：${err.code}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">車輛資訊系統</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              電子郵件
            </label>
            <input
              id="email"
              type="text" 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              密碼
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-center">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;