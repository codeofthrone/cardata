import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDocs, query, where, collection, doc, getDoc } from "firebase/firestore";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      // 登入用戶
      await login(email, password);
      
      // 登入成功後直接導航到首頁
      // AuthContext.jsx 中的 onAuthStateChanged 會處理用戶文檔的檢查和創建
      console.log("登入成功");
      
      // 導航到首頁
      navigate('/');
    } catch (error) {
      console.error("登入錯誤:", error);
      setError('登入失敗：' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center h3 mb-4">
                登入系統
              </h2>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="email-address" className="form-label">電子郵件</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-control"
                    placeholder="電子郵件"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">密碼</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="form-control"
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100"
                  >
                    {loading ? '登入中...' : '登入'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}