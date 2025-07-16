import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import { Navigate } from "react-router-dom";
import './global.css';


function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} /> 
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
