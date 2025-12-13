import { Box, Typography, Avatar, Paper, Divider, Button } from "@mui/material";
import { Person, ExitToApp, Home, TheaterComedy, Group } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Context } from "../..";
import { useContext } from "react";

const AdminHeader = observer(({ userData }) => {
  const { store } = useContext(Context);
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      width: { xs: '100%', md: '450px' },
      flexShrink: 0,
      mb: 4
    }}>
      <Paper elevation={6} sx={{ 
        p: 3,
        backgroundColor: '#2a2a2a',
        borderRadius: 2
      }}>
        {/* Блок с профилем */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, color: "white" }}>
          <Avatar sx={{ 
            width: 64, 
            height: 64,
            bgcolor: '#d32f2f',
            fontSize: '1.5rem'
          }}>
            {userData?.Name?.charAt(0)}{userData?.Surname?.charAt(0)}
          </Avatar>
          
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {userData?.Name} {userData?.Surname}
            </Typography>
            <Typography variant="body2" color="#aaa">
              Администратор
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2, bgcolor: '#444' }} />

        {/* Навигационные кнопки */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate("/")}
            sx={{
              bgcolor: '#424242',
              '&:hover': { bgcolor: '#616161' },
              py: 1.5,
              justifyContent: 'flex-start'
            }}
          >
            На главную
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<Group />}
            onClick={() => navigate("/users")}
            sx={{
              bgcolor: '#424242',
              '&:hover': { bgcolor: '#616161' },
              py: 1.5,
              justifyContent: 'flex-start'
            }}
          >
             Пользователи
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<TheaterComedy />}
            onClick={() => navigate("/addTheatre")}
            sx={{
              bgcolor: '#424242',
              '&:hover': { bgcolor: '#616161' },
              py: 1.5,
              justifyContent: 'flex-start'
            }}
          >
            Управление театрами
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<Person />}
            onClick={() => navigate("/managers")}
            sx={{
              bgcolor: '#424242',
              '&:hover': { bgcolor: '#616161' },
              py: 1.5,
              justifyContent: 'flex-start'
            }}
          >
            Управление менеджерами
          </Button>

          <Button
            fullWidth
            variant="contained"
            startIcon={<ExitToApp />}
            onClick={() => store.logout().then(() => navigate("/login"))}
            sx={{
              bgcolor: '#d32f2f',
              '&:hover': { bgcolor: '#b71c1c' },
              py: 1.5,
              justifyContent: 'flex-start'
            }}
          >
            Выйти
          </Button>
        </Box>
      </Paper>
    </Box>
  );
});

export default AdminHeader;