import { Card, CardContent, Typography, Avatar, Box, Divider } from "@mui/material";
import { Person } from "@mui/icons-material";

const ManagerCard = ({ manager, onSelect, isSelected }) => {
  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: "pointer",
        backgroundColor: isSelected ? '#333' : '#2a2a2a',
        border: isSelected ? '1px solid #d32f2f' : '1px solid #444',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: '#d32f2f',
          backgroundColor: '#333'
        }
      }} 
      onClick={() => onSelect(manager)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: '#d32f2f',
            width: 48,
            height: 48
          }}>
            <Person fontSize="medium" />
          </Avatar>
          
          <Box>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {manager.User?.Name} {manager.User?.Surname}
            </Typography>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              ID: {manager.Manager_id}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2, bgcolor: '#444' }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#ddd' }}>
            <strong>Email:</strong> {manager.User?.Email}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ddd' }}>
            <strong>Телефон:</strong> {manager.Phone_number}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ManagerCard;