import { Helmet } from "react-helmet";
import { useState } from "react";

export default function DashboardC() {
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>車輛總覽</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold">車輛總覽</h1>
        </div>
        <div className="col-auto">
          <small className="text-muted">{new Date().toLocaleDateString('zh-TW')}</small>
        </div>
      </div>
      
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row mb-4 g-3">
            <div className="col-12 col-md">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="搜尋車輛（品牌、型號、車牌）"
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-auto d-flex gap-2">
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel" viewBox="0 0 16 16">
                  <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
                </svg>
                篩選
              </button>
              <button className="btn btn-primary d-flex align-items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
                搜尋
              </button>
            </div>
          </div>
          
          <div className="table-responsive mt-3">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">車牌號碼</th>
                  <th scope="col">品牌/型號</th>
                  <th scope="col">顏色</th>
                  <th scope="col">狀態</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td colSpan="5" className="py-5 text-muted">
                    <div className="d-flex flex-column align-items-center justify-content-center py-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-car-front text-secondary mb-3" viewBox="0 0 16 16">
                        <path d="M4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2H6ZM4.862 4.276 3.906 6.19a.51.51 0 0 0 .497.731c.91-.073.995-.375 1.076-.928.086-.553.342-1.29.342-1.29a.5.5 0 0 1 .497-.731c.91.073.995.375 1.076.929.086.552.342 1.29.342 1.29a.5.5 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 6.826 4H5.9a.5.5 0 0 0-.447.276ZM2.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-11 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
                        <path d="M9.89 4.765A1.5 1.5 0 0 0 8.5 4h-1a1.5 1.5 0 0 0-1.39.765L5.354 6H2a.5.5 0 0 0-.5.5v4A2.5 2.5 0 0 0 4 13h8a2.5 2.5 0 0 0 2.5-2.5v-4a.5.5 0 0 0-.5-.5h-3.354l-.756-1.235ZM2.5 7.5V10h11V7.5h-11Z"/>
                      </svg>
                      <p>暫無車輛資料</p>
                      <button className="btn btn-primary mt-2">
                        新增車輛
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <nav aria-label="Page navigation" className="mt-4">
            <ul className="pagination justify-content-center">
              <li className="page-item disabled">
                <a className="page-link" href="#" tabIndex="-1" aria-disabled="true">上一頁</a>
              </li>
              <li className="page-item active"><a className="page-link" href="#">1</a></li>
              <li className="page-item disabled">
                <a className="page-link" href="#">下一頁</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
  