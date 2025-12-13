import { useLocation } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { 
  Typography, 
  Box, 
  Paper, 
  Divider,
  IconButton,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import { useWebSocket } from './useWebSocket';

const Notifications = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const notification = state?.notification;
  const { deleteNotification } = useWebSocket(); 

  useEffect(() => {
    if (!notification) {
      navigate('/');
    }
  }, [notification, navigate]);

  const getNotificationText = () => {
    if (!notification) return 'Уведомление не найдено';
    if (typeof notification === 'string') return notification;
    if (typeof notification === 'object' && notification.message) {
      return notification.message;
    }
    return 'Неизвестный формат уведомления';
  };

  const getNotificationDate = () => {
    if (!notification) return new Date().toLocaleString();
    if (typeof notification === 'object' && notification.timestamp) {
      return new Date(notification.timestamp).toLocaleString();
    }
    return new Date().toLocaleString();
  };
  
  const handleDelete = () => {
    if (notification?.id) {
      deleteNotification(notification.id);
      navigate('/');
    }
  };

  return (
    <>
    <Header/>
    <Box sx={{ 
      p: 3,
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#121212'
    }}>
      <Paper elevation={3} sx={{ 
        p: 3,
        borderRadius: '12px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #d32f2f'
      }}>
         <Box sx={{ 
            mt: 3,
            display: 'flex',
            justifyContent: 'space-between' 
          }}>
            <Button 
              variant="contained" 
              sx={{
                borderRadius: '20px',
                px: 3,
                textTransform: 'none',
                backgroundColor: '#d32f2f',
                color: 'white',
                fontFamily: '"Gothic", "Arial", sans-serif',
                '&:hover': {
                  backgroundColor: '#b71c1c'
                }
              }}
              onClick={handleDelete}
            >
              Удалить
            </Button>
            
            <Button 
              variant="outlined"
              sx={{
                borderRadius: '20px',
                px: 3,
                textTransform: 'none',
                borderColor: '#d32f2f',
                color: '#d32f2f',
                fontFamily: '"Gothic", "Arial", sans-serif',
                '&:hover': {
                  borderColor: '#b71c1c',
                  color: '#b71c1c'
                }
              }}
              onClick={() => navigate(-1)}
            >
              Назад
            </Button>
          </Box>
        
        <Divider sx={{ 
          my: 2,
          backgroundColor: '#d32f2f'
        }} />
        
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'white',
              fontFamily: '"Gothic", "Arial", sans-serif'
            }}
          >
            {getNotificationText()}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{
              display: 'block',
              mt: 2,
              fontStyle: 'italic',
              color: '#d32f2f',
              fontFamily: '"Gothic", "Arial", sans-serif'
            }}
          >
            {getNotificationDate()}
          </Typography>
        </Box>
        
        
      </Paper>
    </Box>
    </>
  );
};

export default Notifications;