import { useState, useEffect, useContext } from "react";
import { 
  Typography, 
  Button, 
  Box, 
  Container, 
  Avatar,
  IconButton,
  Paper,
  TextField,
  Alert,
  Divider
} from "@mui/material";
import { 
  Theaters, 
  People, 
  CalendarToday,
  Edit
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import { useNavigate } from "react-router-dom";
import ManagerHeader from "../ManagerHeader";

const ManagerPanel = observer(() => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  const [managerData, setManagerData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    phoneNumber: '',
    newPassword: '',
    currentPassword: ''
  });
  const [errors, setErrors] = useState({});

  // Регулярные выражения для валидации
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/; // Только буквы без пробелов
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Базовый email формат
  const phoneRegex = /^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/; // Формат +375(xx)xxx-xx-xx

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const user = store.user;
        const data = await store.getManagerByUserId(user.id);
        setManagerData(data);
        setFormData({
          email: data.email,
          name: data.name,
          surname: data.surname,
          phoneNumber: data.phoneNumber || "",
          newPassword: '',
          currentPassword: ''
        });
      } catch (err) {
        setError("Ошибка загрузки данных");
        setTimeout(() => setError(""), 5000);
      }
    };
    fetchManagerData();
  }, [store]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const validateForm = () => {
    const newErrors = {};
    
    // Валидация имени
    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя';
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = 'Имя должно содержать только буквы без пробелов';
    }
    
    // Валидация фамилии
    if (!formData.surname.trim()) {
      newErrors.surname = 'Введите фамилию';
    } else if (!nameRegex.test(formData.surname)) {
      newErrors.surname = 'Фамилия должна содержать только буквы без пробелов';
    }
    
    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }
    
    // Валидация телефона (если заполнен)
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Формат: +375(xx)xxx-xx-xx';
    }
    
    // Валидация пароля (если заполнен)
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'Пароль должен быть не менее 6 символов';
    }
    
    // Валидация текущего пароля (если меняется пароль)
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль для подтверждения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    // Автоматическое форматирование телефона
    let formattedValue = value.replace(/\D/g, '');
    
    if (formattedValue.length > 0) {
      formattedValue = `+${formattedValue}`;
      if (formattedValue.length > 4) {
        formattedValue = `${formattedValue.slice(0, 4)}(${formattedValue.slice(4)}`;
      }
      if (formattedValue.length > 7) {
        formattedValue = `${formattedValue.slice(0, 7)})${formattedValue.slice(7)}`;
      }
      if (formattedValue.length > 11) {
        formattedValue = `${formattedValue.slice(0, 11)}-${formattedValue.slice(11)}`;
      }
      if (formattedValue.length > 14) {
        formattedValue = `${formattedValue.slice(0, 14)}-${formattedValue.slice(14, 16)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, phoneNumber: formattedValue }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    
    if (!validateForm()) return;

    try {
      if (formData.newPassword) {
        const isPasswordValid = await store.varifyPassword(store.user.id, formData.currentPassword);
        if (!isPasswordValid) {
          setErrors({ currentPassword: 'Неверный текущий пароль' });
          return;
        }
      }

      const response = await store.updateManager(
        managerData.managerId,
        formData.email,
        formData.newPassword || undefined,
        formData.name,
        formData.surname,
        formData.phoneNumber,
        managerData.theatreId,
        managerData.addInfo
      );

      if (response.errors) {
        const serverErrors = {};
        response.errors.forEach(error => {
          if (error.path) {
            serverErrors[error.path] = error.msg;
          }
        });
        setErrors(serverErrors);
        
        if (response.message) {
          setError(response.message);
        }
        return;
      }

      const updatedData = await store.getManagerByUserId(store.user.id);
      setManagerData(updatedData);
      setFormData({
        ...formData,
        newPassword: '',
        currentPassword: ''
      });
      setSuccess("Данные успешно обновлены");
      setEditMode(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          if (error.path) {
            serverErrors[error.path] = error.msg;
          }
        });
        setErrors(serverErrors);
        
        if (err.response.data.message) {
          setError(err.response.data.message);
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Ошибка обновления данных");
      }
    }
  };

  if (!managerData) return <Typography>Загрузка...</Typography>;

  return (
    <>
      <ManagerHeader/>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {(error || success) && (
            <Box sx={{ position: 'fixed', top: 70, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
              <Alert 
                severity={error ? 'error' : 'success'} 
                sx={{ 
                  width: 'auto', 
                  maxWidth: '90%',
                  boxShadow: 3,
                  animation: `${error || success ? 'fadeIn 0.3s ease-in-out' : ''}`
                }}
              >
                {error || success}
              </Alert>
            </Box>
          )}

          {editMode ? (
            <Paper elevation={3} sx={{ 
              p: 3,
              backgroundColor: '#2a2a2a',
              borderRadius: 2
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5"sx={{color:'white'}}>Редактирование профиля</Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                    setSuccess("");
                  }}
                  sx={{ color: '#aaa', borderColor: '#555' }}
                >
                  Отмена
                </Button>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#d32f2f' },
                      color: 'white'
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' }
                  }}
                />
                <TextField
                  label="Имя"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#d32f2f' },
                      color: 'white'
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' }
                  }}
                />
                <TextField
                  label="Фамилия"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  error={!!errors.surname}
                  helperText={errors.surname}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#d32f2f' },
                      color: 'white'
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' }
                  }}
                />
                <TextField
                  label="Телефон (формат: +375(xx)xxx-xx-xx)"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#d32f2f' },
                      color: 'white'
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' }
                  }}
                />
                <TextField
                  label="Новый пароль (оставьте пустым, чтобы не менять)"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#d32f2f' },
                      color: 'white'
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' }
                  }}
                />
                {formData.newPassword && (
                  <TextField
                    label="Текущий пароль (для подтверждения)"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#d32f2f' },
                        color: 'white'
                      },
                      '& .MuiInputLabel-root': { color: '#aaa' }
                    }}
                  />
                )}
                <Button 
                  variant="contained" 
                  onClick={handleUpdate}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' }
                  }}
                >
                  Сохранить изменения
                </Button>
              </Box>
            </Paper>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: 3 
            }}>
              {/* Quick Actions */}
              <Paper elevation={3} sx={{ 
                p: 3,
                backgroundColor: '#2a2a2a',
                borderRadius: 2
              }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Быстрые действия
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Theaters />}
                    onClick={() => navigate("/addShow")}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#424242',
                      '&:hover': { backgroundColor: '#616161' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    Добавить постановку
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CalendarToday />}
                    onClick={() => navigate("/addSeance")}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#424242',
                      '&:hover': { backgroundColor: '#616161' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    Добавить сеанс
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<People />}
                    onClick={() => navigate("/addCast")}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#424242',
                      '&:hover': { backgroundColor: '#616161' },
                      justifyContent: 'flex-start'
                    }}
                  >
                    Добавить актёров
                  </Button>
                </Box>
              </Paper>

              {/* Profile Info */}
              <Paper elevation={3} sx={{ 
                p: 3,
                backgroundColor: '#2a2a2a',
                borderRadius: 2
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Ваш профиль
                  </Typography>
                  <IconButton onClick={() => setEditMode(true)} sx={{ color: '#aaa' }}>
                    <Edit />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: '#d32f2f',
                    width: 64,
                    height: 64
                  }}>
                    {managerData.name?.charAt(0)}{managerData.surname?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {managerData.name} {managerData.surname}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {managerData.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#444' }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    <strong>Телефон:</strong> {managerData.phoneNumber || 'Не указан'}
                  </Typography>
                  {managerData.addInfo && (
                    <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
                      <strong>Доп. информация:</strong> {managerData.addInfo}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
});

export default ManagerPanel;