import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CastleIcon from '@mui/icons-material/Castle';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: 'white',
        textAlign: 'center',
        p: 3
      }}
    >
      <CastleIcon 
        sx={{ 
          fontSize: '5rem', 
          color: '#d32f2f',
          mb: 2,
          transform: 'scaleX(-1)'
        }} 
      />
      <Typography 
        variant="h2" 
        component="h1" 
        sx={{ 
          mb: 2,
          fontFamily: '"Gothic", "Arial", sans-serif',
          fontWeight: 'bold'
        }}
      >
        404
      </Typography>
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 3,
          fontFamily: '"Gothic", "Arial", sans-serif'
        }}
      >
        Страница не найдена
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 4,
          fontFamily: '"Gothic", "Arial", sans-serif'
        }}
      >
        Похоже, что страница, которую вы ищете, не существует или была перемещена.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        sx={{
          backgroundColor: '#d32f2f',
          color: 'white',
          fontFamily: '"Gothic", "Arial", sans-serif',
          '&:hover': {
            backgroundColor: '#b71c1c'
          }
        }}
      >
        Вернуться на главную
      </Button>
    </Box>
  );
};

export default NotFound;