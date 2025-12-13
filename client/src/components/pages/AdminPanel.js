import { Container, Box, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import AdminHeader from "../admin/AdminHeader";

const AdminPanel = observer(() => {
  const { store } = useContext(Context);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await store.getUser(store.user.id);
        setUserData(data);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (store.user.id) {
      fetchUserData();
    }
  }, [store]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {/* Индикатор загрузки */}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="100vw" sx={{ 
      py: 4,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '40px'
    }}>
      {/* Левая колонка - AdminHeader */}
      <Box sx={{ 
        width: '350px',
        flexShrink: 0,
        position: 'sticky',
        top: '20px'
      }}>
        <AdminHeader userData={userData} />
      </Box>

      {/* Правая колонка - контент */}
      <Box sx={{ 
        flex: 1,
        minWidth: 0, // Предотвращает переполнение
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        p: 4,
        maxWidth: '70vw' // 350px + 40px gap
      }}>
        <Typography variant="h4" sx={{ 
          color: 'white',
          mb: 3,
          fontWeight: 600
        }}>
          Панель администратора
        </Typography>
        
        <Typography variant="body1" sx={{ color: '#aaa', mb: 2 }}>
          Добро пожаловать в панель управления системой. Здесь вы можете:
        </Typography>
        
        <Box component="ul" sx={{ 
          color: '#aaa',
          pl: 3,
          mb: 4,
          '& li': { mb: 1 }
        }}>
          <li>Управлять пользователями системы</li>
          <li>Добавлять и редактировать театры</li>
          <li>Назначать менеджеров</li>
          <li>Просматривать статистику</li>
        </Box>
        
        <Typography variant="body2" sx={{ 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Выберите нужный раздел в меню слева
        </Typography>
      </Box>
    </Container>
  );
});

export default AdminPanel;