import { useState, useContext, useEffect } from "react";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Divider,
  Avatar,
  Chip,
  Alert,
  TextField,
  InputAdornment
} from "@mui/material";
import { Person, Group, SupervisorAccount, Search } from "@mui/icons-material";

const UsersTable = observer(() => {
  const { store } = useContext(Context);
  const [allUsers, setAllUsers] = useState([]); // Все пользователи (без фильтрации)
  const [filteredUsers, setFilteredUsers] = useState([]); // Отфильтрованные пользователи
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async (type) => {
    setLoading(true);
    setError('');
    setActiveTab(type);
    setSearchQuery(''); // Сброс поиска при смене вкладки
    
    try {
      let data;
      switch(type) {
        case 'users':
          data = await store.GetUsers();
          break;
        case 'managers':
          data = await store.getManagers();
          data = data.map(manager => ({
            id: manager.Manager_id,
            Name: manager.User.Name,
            Surname: manager.User.Surname,
            Email: manager.User.Email,
            Phone_number: manager.Phone_number,
            Role: 'manager',
            Additional_info: manager.Additional_info
          }));
          break;
        case 'clients':
          data = await store.getClients();
          break;
        default:
          return;
      }
      setAllUsers(data);
      setFilteredUsers(data); // Изначально отображаем всех пользователей
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  // Эффект для фильтрации пользователей при изменении поискового запроса
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allUsers.filter(user => 
        (user.Name && user.Name.toLowerCase().includes(query)) ||
        (user.Surname && user.Surname.toLowerCase().includes(query)) ||
        (user.id && user.id.toString().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'CLIENT': return 'success';
      default: return 'info';
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 3,
      backgroundColor: '#2a2a2a',
      borderRadius: 2
    }}>
      <Typography variant="h5" sx={{ 
        color: 'white',
        mb: 3,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Управление пользователями
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          variant="contained"
          onClick={() => fetchUsers('users')}
          disabled={loading}
          startIcon={<Group />}
          sx={{
            flex: 1,
            py: 1.5,
            backgroundColor: activeTab === 'users' ? '#d32f2f' : '#424242',
            '&:hover': { backgroundColor: activeTab === 'users' ? '#b71c1c' : '#616161' }
          }}
        >
          Все пользователи
        </Button>

        <Button
          variant="contained"
          onClick={() => fetchUsers('managers')}
          disabled={loading}
          startIcon={<SupervisorAccount />}
          sx={{
            flex: 1,
            py: 1.5,
            backgroundColor: activeTab === 'managers' ? '#d32f2f' : '#424242',
            '&:hover': { backgroundColor: activeTab === 'managers' ? '#b71c1c' : '#616161' }
          }}
        >
          Менеджеры
        </Button>

        <Button
          variant="contained"
          onClick={() => fetchUsers('clients')}
          disabled={loading}
          startIcon={<Person />}
          sx={{
            flex: 1,
            py: 1.5,
            backgroundColor: activeTab === 'clients' ? '#d32f2f' : '#424242',
            '&:hover': { backgroundColor: activeTab === 'clients' ? '#b71c1c' : '#616161' }
          }}
        >
          Клиенты
        </Button>
      </Box>

      {/* Добавлен поиск */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Поиск по имени, фамилии"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ 
          mb: 3,
          backgroundColor: '#424242',
          borderRadius: 1,
          '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': {
              borderColor: '#555',
            },
            '&:hover fieldset': {
              borderColor: '#777',
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#aaa' }} />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography variant="body1" sx={{ color: '#aaa', textAlign: 'center' }}>
          Загрузка...
        </Typography>
      ) : filteredUsers.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
          gap: 2 
        }}>
          {filteredUsers.map((user) => (
            <Card key={user.id} sx={{ 
              backgroundColor: '#333',
              borderRadius: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: '#d32f2f',
                    width: 48,
                    height: 48
                  }}>
                    {user.Name?.charAt(0)}{user.Surname?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {user.Name} {user.Surname}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {user.Email}
                    </Typography>
                    {user.Additional_info && (
                      <Typography variant="caption" sx={{ color: '#aaa', fontStyle: 'italic' }}>
                        {user.Additional_info}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1, bgcolor: '#444' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label={user.Role} 
                    color={getRoleColor(user.Role)} 
                    size="small"
                  />
                  {user.Phone_number && (
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {user.Phone_number}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography variant="body1" sx={{ color: '#aaa', textAlign: 'center' }}>
          {searchQuery ? 'Ничего не найдено' : activeTab ? 'Нет данных для отображения' : 'Выберите тип пользователей'}
        </Typography>
      )}
    </Paper>
  );
});

export default UsersTable;