import { useState, useEffect, useContext } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress
} from "@mui/material";
import { 
  AccountCircle, 
  ExitToApp, 
  Theaters, 
  People, 
  CalendarToday,
  ConfirmationNumber // Иконка для билетов
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Context } from "../..";
import { useNavigate } from "react-router-dom";

const ManagerHeader = observer(() => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const user = store.user;
        if (!user || !user.id) {
          throw new Error("User not authenticated");
        }
        
        const data = await store.getManagerByUserId(user.id);
        setManagerData(data);
      } catch (err) {
        setError("Ошибка загрузки данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchManagerData();
  }, [store]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    store.logout().then(() => navigate("/login"));
  };

  if (loading) {
    return (
      <AppBar position="static" sx={{ bgcolor: '#2a2a2a' }}>
        <Toolbar>
          <CircularProgress size={24} color="inherit" />
        </Toolbar>
      </AppBar>
    );
  }

  if (error || !managerData) {
    return (
      <AppBar position="static" sx={{ bgcolor: '#2a2a2a' }}>
        <Toolbar>
          <Typography color="error">{error || "Ошибка загрузки профиля"}</Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static" sx={{ bgcolor: '#2a2a2a' }}>
      <Toolbar>
        <Theaters sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Панель менеджера
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <Button 
            color="inherit" 
            startIcon={<Theaters />}
            onClick={() => navigate("/allShows")}
          >
            Постановки
          </Button>
          <Button 
            color="inherit" 
            startIcon={<CalendarToday />}
            onClick={() => navigate("/seances")}
          >
            Сеансы
          </Button>
          <Button 
            color="inherit" 
            startIcon={<People />}
            onClick={() => navigate("/addCast")}
          >
            Актёры
          </Button>
          <Button 
            color="inherit" 
            startIcon={<ConfirmationNumber />}
            onClick={() => navigate("/getTicketsWithDetails")}
            sx={{ color: 'white' }} // Красный акцент
          >
            Все брони
          </Button>
        </Box>

        <IconButton
          size="large"
          edge="end"
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ ml: 2 }}
        >
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            bgcolor: '#d32f2f',
            fontSize: '0.875rem'
          }}>
            {managerData.name?.charAt(0)}{managerData.surname?.charAt(0)}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              bgcolor: '#2a2a2a',
              color: 'white'
            }
          }}
        >
          <MenuItem disabled>
            <Typography>{managerData.name} {managerData.surname}</Typography>
          </MenuItem>
          <Divider sx={{ bgcolor: '#444' }} />
          <MenuItem onClick={() => { handleMenuClose(); navigate("/"); }}>
            <AccountCircle sx={{ mr: 1 }} /> Профиль
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 1 }} /> Выйти
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
});

export default ManagerHeader;