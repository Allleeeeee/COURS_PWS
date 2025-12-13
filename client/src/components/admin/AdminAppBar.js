import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem, Divider } from "@mui/material";
import { Person, ExitToApp, Home, TheaterComedy, Group, Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "../..";
import { useContext, useState } from "react";

const AdminAppBar = observer(({ userData }) => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    store.logout().then(() => navigate("/login"));
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#2a2a2a' }}>
      <Toolbar>
        {/* Лого/Название */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer'
          }}
          onClick={() => navigate("/")}
        >
          <TheaterComedy />
          Theatre Admin
        </Typography>

        {/* Десктопное меню */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <Button 
            color="inherit" 
            startIcon={<Home />}
            onClick={() => navigate("/")}
          >
            Главная
          </Button>
          
          <Button 
            color="inherit" 
            startIcon={<Group />}
            onClick={() => navigate("/users")}
          >
            Пользователи
          </Button>
          
          <Button 
            color="inherit" 
            startIcon={<TheaterComedy />}
            onClick={() => navigate("/addTheatre")}
          >
            Театры
          </Button>
          
          <Button 
            color="inherit" 
            startIcon={<Person />}
            onClick={() => navigate("/managers")}
          >
            Менеджеры
          </Button>
        </Box>

        {/* Профиль пользователя */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          {/* <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ 
              width: 32, 
              height: 32,
              bgcolor: '#d32f2f',
              fontSize: '0.875rem'
            }}>
              {userData?.Name?.charAt(0)}{userData?.Surname?.charAt(0)}
            </Avatar>
          </IconButton> */}
          
          {/* <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {userData?.Name} {userData?.Surname}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleNavigation("/")}>
              <Home sx={{ mr: 1 }} /> Главная
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/users")}>
              <Group sx={{ mr: 1 }} /> Пользователи
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/addTheatre")}>
              <TheaterComedy sx={{ mr: 1 }} /> Театры
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/managers")}>
              <Person sx={{ mr: 1 }} /> Менеджеры
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} /> Выйти
            </MenuItem>
          </Menu> */}
        </Box>

        {/* Мобильное меню */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-controls="mobile-menu"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

export default AdminAppBar;