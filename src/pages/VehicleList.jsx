import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "vehicles"));
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

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
