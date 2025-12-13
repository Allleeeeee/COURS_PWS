import { Card, CardContent, Typography, Paper } from "@mui/material";

const TheatreCard = ({ theatre, onSelect, isSelected }) => {
  return (
    <Paper 
      elevation={3}
      onClick={() => onSelect(theatre)}
      sx={{
        mb: 2,
        p: 2,
        cursor: "pointer",
        backgroundColor: isSelected ? '#333' : '#2a2a2a',
        borderLeft: isSelected ? '4px solid #d32f2f' : '4px solid transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: '#333'
        }
      }}
    >
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
        {theatre.ThName}
      </Typography>
       <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
        <strong>Город:</strong> {theatre.ThCity}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
        <strong>Адрес:</strong> {theatre.ThAddress}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa' }}>
        <strong>Email:</strong> {theatre.ThEmail}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
        <strong>Телефон:</strong> {theatre.ThPhone}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
        <strong>График работы:</strong> {theatre.WorkingHours}
      </Typography>
      {theatre.ThDescription && (
        <Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>
          {theatre.ThDescription}
        </Typography>
      )}
    </Paper>
  );
};

export default TheatreCard;