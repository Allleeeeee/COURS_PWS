import React, { useState } from "react";
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Typography, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
} from "@mui/material";
import { 
  TheaterComedy, 
  Festival, 
  AccountCircle, 
  LocalPlay,
  Notifications as NotificationsIcon
} from "@mui/icons-material";
import CastleIcon from '@mui/icons-material/Castle';
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import "./styles/Header.css";

const Header = observer(() => {
  const navigate = useNavigate();
  const { store } = React.useContext(Context);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openTelegramModal, setOpenTelegramModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [telegramCode, setTelegramCode] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConnectClick = () => {
    setOpenConfirmModal(true);
    handleMenuClose();
  };

  const handleConfirmConnect = async () => {
    setOpenConfirmModal(false);
    try {
      const response = await store.generatecode(store.user.id);
      setTelegramCode(response.code);
      setOpenTelegramModal(true);
    } catch (err) {
      console.error("Ошибка при генерации кода для Telegram:", err);
    }
  };

  const handleCloseModal = () => {
    setOpenTelegramModal(false);
    setOpenConfirmModal(false);
  };

  return (
    <>
      <AppBar position="static" className="app-bar" sx={{ 
        backgroundColor: '#121212',
        fontFamily: '"Gothic", "Arial", sans-serif'
      }}>
        <Toolbar>
          {/* Левый блок - Логотип */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CastleIcon sx={{
              mr: 2,
              color: "#d32f2f",
              fontSize: '4.3rem',
              transform: 'scaleX(-1)' 
            }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: "white",
                cursor: 'pointer',
                fontFamily: '"Gothic", "Arial", sans-serif',
                fontWeight: 'bold'
              }}
              onClick={() => navigate("/")}
            >
              AfishaApp
            </Typography>
          </Box>
      
          {/* Правый блок - Кнопки */}
          <Box className="right-buttons" sx={{ 
            display: 'flex', 
            alignItems: 'center',
            marginLeft: 'auto' // Сдвигаем кнопки вправо
          }}>
            <Button 
              color="inherit" 
              startIcon={<LocalPlay />}
              onClick={() => navigate("/")}
              sx={{ 
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.1)'
                },
                fontFamily: '"Gothic", "Arial", sans-serif'
              }}
            >
              Сеансы
            </Button>

            <Button 
              color="inherit" 
              startIcon={<Festival />}
              onClick={() => navigate("/OurTheatres")}
              sx={{ 
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.1)'
                }
              }}
            >
              Театры
            </Button>
            {store.user?.role === "client" ? (
              <Button 
                color="inherit" 
                startIcon={<AccountCircle />}
                onClick={() => navigate("/profile")}
                sx={{ 
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                Личный кабинет
              </Button>
            ) : (
              <Button 
                color="inherit" 
                startIcon={<AccountCircle />}
                onClick={() => navigate("/login")}
                sx={{ 
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                Войти
              </Button>
            )}
            {store.user?.role === "client" && (
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ 
                  ml: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                <NotificationsIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Меню уведомлений */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            width: '300px',
            backgroundColor: '#1e1e1e',
            color: 'white',
            marginLeft: '0px' // Сдвигаем меню влево
          },
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={handleConnectClick}
          sx={{
            '&:hover': {
              backgroundColor: '#2e2e2e',
            }
          }}
        >
          Подключить Telegram уведомления
        </MenuItem>
      </Menu>

      {/* Модальное окно подтверждения */}
      <Dialog open={openConfirmModal} onClose={handleCloseModal}>
        <DialogTitle sx={{ 
          fontFamily: '"Cormorant", serif', 
          fontSize: '2rem',
          fontWeight: 600,
          textAlign: 'center',
          color: '#d32f2f'
        }}>
          Подключить Telegram уведомления?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ 
            fontFamily: '"Cormorant", serif',
            fontSize: '1.5rem',
            textAlign: 'center',
            mb: 2
          }}>
            Хотите получать уведомления о бронированиях в Telegram?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleConfirmConnect}
            sx={{
              color: 'white',
              backgroundColor: '#d32f2f',
              fontFamily: '"Cormorant", serif',
              fontSize: '1.3rem',
              padding: '8px 20px',
              mr: 2,
              '&:hover': {
                backgroundColor: '#b71c1c'
              }
            }}
          >
            Да
          </Button>
          <Button 
            onClick={handleCloseModal}
            sx={{
              color: '#d32f2f',
              fontFamily: '"Cormorant", serif',
              fontSize: '1.3rem',
              border: '1px solid #d32f2f',
              padding: '8px 20px',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)'
              }
            }}
          >
            Нет
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно с кодом Telegram */}
      <Dialog open={openTelegramModal} onClose={handleCloseModal}>
        <DialogTitle sx={{ 
          fontFamily: '"Cormorant", serif', 
          fontSize: '2rem',
          fontWeight: 600,
          textAlign: 'center',
          color: '#d32f2f'
        }}>
          Ваш код для привязки
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              mb: 3, 
              fontFamily: '"Cormorant", serif',
              fontSize: '1.5rem',
              fontWeight: 500
            }}>
              Код: 
              <Box component="span" sx={{ 
                display: 'inline-block',
                backgroundColor: '#f5f5f5',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                ml: 1,
                color: '#d32f2f',
                fontSize: '1.8rem',
                fontWeight: 700
              }}>
                {telegramCode}
              </Box>
            </Typography>
            <Typography sx={{ 
              mb: 3, 
              fontFamily: '"Cormorant", serif',
              fontSize: '1.3rem'
            }}>
              Перейдите в бота и введите этот код:
            </Typography>
            <Link 
              href="https://t.me/Afisha_App_bot" 
              target="_blank"
              rel="noopener"
              sx={{
                display: 'inline-block',
                backgroundColor: '#0088cc',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontFamily: '"Cormorant", serif',
                fontSize: '1.3rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#0077b3'
                }
              }}
            >
              Открыть Telegram бота
            </Link>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCloseModal}
            sx={{
              color: 'white',
              backgroundColor: '#d32f2f',
              fontFamily: '"Cormorant", serif',
              fontSize: '1.3rem',
              padding: '8px 30px',
              '&:hover': {
                backgroundColor: '#b71c1c'
              }
            }}
          >
            Готово
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default Header;