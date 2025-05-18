import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser) {
          setError("請先登入");
          return;
        }
        const snapshot = await getDocs(collection(db, "vehicles"));
        setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setError("");
      } catch (err) {
        console.error("獲取車輛資料時出錯:", err);
        setError("獲取車輛資料時出錯：" + err.message);
      }
    };
    fetchData();
  }, [currentUser]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">車輛資訊</h2>
      <ul className="space-y-2">
        {vehicles.map(v => (
          <li key={v.id} className="border p-4 rounded shadow">
            <div><strong>廠牌：</strong>{v.brand}</div>
            <div><strong>車型：</strong>{v.model}</div>
            <div><strong>車牌：</strong>{v.plate}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
