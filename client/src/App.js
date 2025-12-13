import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useCallback } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import Registration from "./components/Registration";
import ClientDashboard from "./components/user/pages/ClientDashboard";
import AdminPanel from "./components/pages/AdminPanel";
import { Context } from '.';
import {observer} from 'mobx-react-lite';
import UsersPage from "./components/pages/UsersPage";
import TheatrePage from "./components/pages/TheatrePage";
import ManagersPage from "./components/pages/ManagersPage";
import ManagerPanel from "./components/manager/pages/ManagerPanel";
import AddShow from "./components/manager/AddShow";
import ShowPage from "./components/manager/pages/ShowPage";
import ShowDetails from "./components/manager/ShowDetails";
import AddCast from "./components/manager/AddCast";
import AddSeance from "./components/manager/AddSeance";
import SeancePage from "./components/manager/pages/SeancePage";
import SeanceDetail from "./components/manager/SeanceDetail";
import ManagerProfile from "./components/manager/pages/ManagerProfile";
import UserPanel from "./components/user/pages/UserPanel";
import SeanceUserDetails from "./components/user/pages/SeanceUserDelails";
import GetTicket from "./components/user/pages/GetTicket";
import TheatersDash from "./components/user/pages/TheatresDash";
import TheatreDashDetail from "./components/user/components/TheatreDashDetails";
import TheatreSeancesPage from "./components/user/pages/TheatreSeancesPage";
import ActorPage from "./components/user/pages/ActorPage";
import PoiskPerson from "./components/manager/pages/PoiskPerson";
import TicketsInfo from "./components/manager/pages/TicketsInfo";
import { CircularProgress, Box } from "@mui/material";
import AuthRequiredModal from "./components/user/components/AuthRequiredModal"
import Notifications from "./components/user/components/Notifications";
import NotFound from "./components/user/pages/NotFound";
import ErrorBoundary from "./components/admin/ErrorBoundary";
import CommentPage from "./components/user/pages/CommentPage";

function App() {
  const { store } = useContext(Context);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('token')) {
        await store.checkAuth();
      }
      setIsAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authModalOpen && shouldRedirectToLogin) {
      setShouldRedirectToLogin(false);
      navigate("/login");
    }
  }, [authModalOpen, shouldRedirectToLogin, navigate]);

  const handleModalCloseAndNavigate = useCallback(() => {
    setAuthModalOpen(false); // Сначала закрываем модалку
    setTimeout(() => {
      navigate("/login"); // Потом переходим на логин
    }, 0); // Мгновенно (или 100-200мс, если нужна анимация)
  }, [navigate]);
  

  const ProtectedRoute = ({ element, requiredRole = null }) => {
    if (!store.isAuth || (requiredRole && store.user?.role !== requiredRole)) {
      if (!authModalOpen) {
        setAuthModalOpen(true);
      }
      return null;
    }
    return element;
  };

  if (!isAuthChecked || store.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  };

  function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Что-то пошло не так:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Попробовать снова</button>
    </div>
  );
}

  return (
    <>
      <Routes>
        {!store.isAuth ? (
          <>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/" element={<UserPanel/>} />
            <Route path="/seance/:id" element={<SeanceUserDetails/>} />
            <Route path="/OurTheatres" element={<TheatersDash/>} />
            <Route path="/OurTheatres/:id" element={<TheatreDashDetail/>} />
            <Route path="/OurTheatres/:id/seances" element={<TheatreSeancesPage/>} />
            <Route path="/actor/:id" element={<ActorPage />} />
            {/* <Route path="/profile" element={<ProtectedRoute element={<ClientDashboard/>} requiredRole="client" />} />
            <Route path="/getTicket/:id" element={<ProtectedRoute element={<GetTicket/>} requiredRole="client" />} /> */}
<Route path="/profile" element={<LoginForm />} />
<Route path="/getTicket/:id" element={<LoginForm />} />
<Route path="*" element={<NotFound />} />
          </>
        ) : (
          store.user?.role === "admin" ? (
            <>
              <Route path="/" element={<AdminPanel />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/addTheatre" element={<TheatrePage />} />
              <Route path="/managers" element={<ManagersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : store.user?.role === "manager" ? (
            <>
              <Route path="/" element={<ManagerPanel />} />
              <Route path="/addShow" element={<AddShow/>} />
              <Route path="/allShows" element={<ShowPage/>} />
              <Route path="/allShows/:id" element={<ShowDetails />} />
              <Route path="/addCast" element={<AddCast/>} />
              <Route path="/addSeance" element={<AddSeance/>} />
              <Route path="/seances" element={<SeancePage/>} />
              <Route path="/seance/:id" element={<SeanceDetail/>} />
              <Route path="/managerProfile" element={<ManagerProfile/>} />
              <Route path="/getTicketsWithDetails" element={<TicketsInfo/>} />
              <Route path="/poisk" element={<PoiskPerson/>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<UserPanel/>} />
              <Route path="/profile" element={<ClientDashboard/>} />
              <Route path="/seance/:id" element={<SeanceUserDetails/>} />
              <Route path="/getTicket/:id" element={<GetTicket/>} />
              <Route path="/OurTheatres" element={<TheatersDash/>} />
              <Route path="/OurTheatres/:id" element={<TheatreDashDetail/>} />
              <Route path="/OurTheatres/:id/seances" element={<TheatreSeancesPage/>} />
              <Route path="/actor/:id" element={<ActorPage />} />
              <Route path="/notifications" element={<Notifications/>} />
              <Route path="/comment/:showId/:userId" element={<CommentPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )
        )}
      </Routes>

      <AuthRequiredModal 
  open={authModalOpen} 
  onClose={() => setAuthModalOpen(false)}
  onLogin={handleModalCloseAndNavigate}
/>
    </>
    
  );
}

export default observer(App);