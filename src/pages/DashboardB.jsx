import { Helmet } from "react-helmet";

export default function DashboardB() {
  return (
    <div className="container py-4">
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <title>維修進程管理</title>
      </Helmet>
      
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="fw-bold">維修進程管理</h1>
        </div>
        <div className="col-auto">
          <small className="text-muted">{new Date().toLocaleDateString('zh-TW')}</small>
        </div>
      </div>
      
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="card-title h5 fw-semibold">維修狀態總覽</h2>
            <button className="btn btn-primary d-flex align-items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              新增維修記錄
            </button>
          </div>
          
          <div className="row mt-4">
            <div className="col-md-6 mb-4 mb-md-0">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-subtitle h6 fw-medium">待處理維修</h3>
                    <span className="badge bg-warning text-dark rounded-pill">0 項目</span>
                  </div>
                  <div className="border border-2 border-dashed rounded p-4 d-flex justify-content-center align-items-center bg-light" style={{height: "160px"}}>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-inbox text-secondary mb-2" viewBox="0 0 16 16">
                        <path d="M4.98 4a.5.5 0 0 0-.39.188L1.54 8H6a.5.5 0 0 1 .5.5 1.5 1.5 0 1 0 3 0A.5.5 0 0 1 10 8h4.46l-3.05-3.812A.5.5 0 0 0 11.02 4H4.98zm-1.17-.437A1.5 1.5 0 0 1 4.98 3h6.04a1.5 1.5 0 0 1 1.17.563l3.7 4.625a.5.5 0 0 1 .106.374l-.39 3.124A1.5 1.5 0 0 1 14.117 13H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .106-.374l3.7-4.625z"/>
                      </svg>
                      <span className="text-muted">尚無待處理項目</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="card-subtitle h6 fw-medium">已完成維修</h3>
                    <span className="badge bg-success rounded-pill">0 項目</span>
                  </div>
                  <div className="border border-2 border-dashed rounded p-4 d-flex justify-content-center align-items-center bg-light" style={{height: "160px"}}>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-check-circle text-secondary mb-2" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                      </svg>
                      <span className="text-muted">尚無已完成項目</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title h5 fw-semibold mb-4">最近活動</h2>
          <hr className="my-3" />
          <div className="text-center py-4 text-muted">
            暫無活動記錄
          </div>
        </div>
      </div>
    </div>
  );
}
  