import { useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography 
} from "@mui/material";

const AuthRequiredModal = ({ open, onClose, onLogin }) => {
    const navigate = useNavigate();
    
    const handleLogin = useCallback(() => {
      onClose();
      // Ждём завершения закрытия модалки
      setTimeout(() => navigate("/login"), 300); // 300 мс — типичное время анимации MUI
    }, [onClose, navigate]);
  
    const dialogStyles = {
      '& .MuiPaper-root': {
        backgroundColor: '#2a2a2a',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        minWidth: '400px'
      },
      '& .MuiDialogTitle-root': {
        color: '#d32f2f',
        fontWeight: '600',
        fontSize: '1.5rem',
        borderBottom: '1px solid #444',
        paddingBottom: '12px'
      },
      '& .MuiDialogContent-root': {
        padding: '20px 0',
        color: '#eee'
      },
      '& .MuiDialogActions-root': {
        padding: '16px 0 0 0',
        justifyContent: 'center'
      }
    };
  
    return (
        <Dialog 
          open={open} 
          onClose={onClose}
          sx={dialogStyles}
        >
          <DialogTitle>Требуется авторизация</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Для доступа к этой странице необходимо войти в личный кабинет.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: '#555',
                '&:hover': { borderColor: '#d32f2f' }
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={onLogin}
              variant="contained"
              sx={{
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' }
              }}
            >
              Войти
            </Button>
          </DialogActions>
        </Dialog>
      );
    };
  

export default AuthRequiredModal;