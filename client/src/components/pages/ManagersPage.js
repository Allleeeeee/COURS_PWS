import { useState, useContext, useEffect } from "react";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import { 
  Container, 
  Box, 
  Typography, 
  Alert, 
  Button, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import ManagerCard from "../admin/ManagerCard";
import CreateManager from "../admin/CreateManager";
import AdminAppBar from "../admin/AdminAppBar";

const ManagersPage = observer(() => {
  const { store } = useContext(Context);
  const [managers, setManagers] = useState([]);
  const [editingManager, setEditingManager] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sucMessage, setSucMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Добавляем ключ для обновления

  const fetchManagers = async () => {
    try {
      const response = await store.getManagers();
      setManagers(response);
    } catch (err) {
      console.error("Ошибка загрузки менеджеров:", err);
      setErrorMessage("Ошибка загрузки списка менеджеров");
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [refreshKey]); // Добавляем refreshKey в зависимости

  const handleDeleteManager = async () => {
    try {
      await store.deleteManager(editingManager.Manager_id);
      setSucMessage(`Менеджер ${editingManager.User?.Name} успешно удален`);
      setEditingManager(null);
      setOpenDeleteDialog(false);
      
      // Обновляем список через изменение ключа
      setRefreshKey(prev => prev + 1);
      
      setTimeout(() => setSucMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Ошибка при удалении менеджера");
    }
  };

  // Функция для обновления списка после добавления
  const handleManagerAdded = () => {
    setRefreshKey(prev => prev + 1);
    setSucMessage("Менеджер успешно добавлен");
    setTimeout(() => setSucMessage(""), 3000);
  };

  return (
    <>
      <AdminAppBar/>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ 
          p: 3, 
          mb: 3,
          backgroundColor: '#2a2a2a',
          borderRadius: 2
        }}>
          <Typography variant="h5" sx={{ 
            color: 'white',
            mb: 2,
            fontWeight: 600,
            textAlign: 'center'
          }}>
            Управление менеджерами
          </Typography>
          
          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          {sucMessage && <Alert severity="success" sx={{ mb: 2 }}>{sucMessage}</Alert>}
          
          {/* Передаем функцию обратного вызова в CreateManager */}
          <CreateManager onSuccess={handleManagerAdded} />
        </Paper>

        <Paper elevation={3} sx={{ 
          p: 3,
          backgroundColor: '#2a2a2a',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ 
            color: 'white',
            mb: 3,
            textAlign: 'center'
          }}>
            Список менеджеров
          </Typography>
          
          {managers.length > 0 ? (
            managers.map((manager) => (
              <ManagerCard 
                key={manager.Manager_id} 
                manager={manager} 
                onSelect={(m) => {
                  setEditingManager(m);
                  setOpenDeleteDialog(true);
                }}
                isSelected={editingManager?.Manager_id === manager.Manager_id}
              />
            ))
          ) : (
            <Typography variant="body1" sx={{ color: '#aaa', textAlign: 'center' }}>
              Нет зарегистрированных менеджеров
            </Typography>
          )}
        </Paper>

        {/* Диалог подтверждения удаления */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: '#2a2a2a',
              color: 'white'
            }
          }}
        >
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#ddd' }}>
              Вы действительно хотите удалить менеджера {editingManager?.User?.Name}?
            </Typography>
            <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
              Это действие нельзя отменить.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDeleteDialog(false)}
              sx={{ color: '#aaa' }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleDeleteManager}
              sx={{ 
                color: '#fff',
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' }
              }}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </> 
  );
});

export default ManagersPage;