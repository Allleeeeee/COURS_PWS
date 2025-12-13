import { useEffect, useState, useContext } from "react";
import {
  Container, TextField, Button, MenuItem, Typography, Alert, Box
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";

const ManagerProfile = observer(() => {
  const { store } = useContext(Context);
  const [data, setData] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    phoneNumber: '',
    newPassword: '',
    currentPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const user = store.user;
        const managerData = await store.getManagerByUserId(user.id);
        const theatreList = await store.getTheatres();
        
        setData({
          managerId: managerData.managerId,
          email: managerData.email,
          name: managerData.name,
          surname: managerData.surname,
          phoneNumber: managerData.phoneNumber || "",
          theatreId: managerData.theatreId,
          addInfo: managerData.addInfo || ""
        });
        
        setFormData({
          email: managerData.email,
          name: managerData.name,
          surname: managerData.surname,
          phoneNumber: managerData.phoneNumber || "",
          newPassword: '',
          currentPassword: ''
        });
        
        setTheatres(theatreList);
      } catch (err) {
        setError("Ошибка загрузки данных менеджера");
      }
    };

    fetchManagerData();
  }, [store]);

  const validateForm = () => {
    const newErrors = {};
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Подтвердите текущий пароль';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Введите фамилию';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    if (formData.newPassword && formData.newPassword.length < 3) {
      newErrors.newPassword = 'Пароль должен быть не менее 3 символов';
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

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    
    if (!validateForm()) return;

    try {
      // Проверка текущего пароля, если меняется пароль
      if (formData.newPassword) {
        const isPasswordValid = await store.verifyPassword(store.user.id, formData.currentPassword);
        if (!isPasswordValid) {
          setErrors({ currentPassword: 'Неверный текущий пароль' });
          return;
        }
      }

      const response = await store.updateManager(
        data.managerId,
        formData.email,
        formData.newPassword || undefined,
        formData.name,
        formData.surname,
        formData.phoneNumber,
        data.theatreId,
        data.addInfo
      );
      
      if (response.errors) {
        // Обработка ошибок валидации с сервера
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
      } else {
        setSuccess("Данные успешно обновлены");
        setEditMode(false);
        // Обновляем данные после успешного сохранения
        const updatedData = await store.getManagerByUserId(store.user.id);
        setData({
          ...data,
          email: updatedData.email,
          name: updatedData.name,
          surname: updatedData.surname,
          phoneNumber: updatedData.phoneNumber
        });
      }
    } catch (err) {
      // Обработка других ошибок
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

  if (!data) return <Typography>Загрузка...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Личный кабинет менеджера</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box display="flex" flexDirection="column" gap={2}>
        {!editMode ? (
          <>
            <TextField
              label="Email"
              value={data.email}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Имя"
              value={data.name}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Фамилия"
              value={data.surname}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Телефон"
              value={data.phoneNumber}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              select
              label="Театр"
              value={data.theatreId}
              InputProps={{ readOnly: true }}
              fullWidth
            >
              {theatres.map((t) => (
                <MenuItem key={t.ID} value={t.ID}>
                  {t.ThName}
                </MenuItem>
              ))}
            </TextField>
            <Button 
              variant="contained" 
              onClick={() => setEditMode(true)}
              sx={{ mt: 2 }}
            >
              Редактировать профиль
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />
            <TextField
              label="Имя"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
            />
            <TextField
              label="Фамилия"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              error={!!errors.surname}
              helperText={errors.surname}
              fullWidth
            />
            <TextField
              label="Телефон"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              fullWidth
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
              />
            )}
            <TextField
              select
              label="Театр"
              value={data.theatreId}
              onChange={(e) => setData({ ...data, theatreId: e.target.value })}
              InputProps={{ readOnly: true }}
              fullWidth
            >
              {theatres.map((t) => (
                <MenuItem key={t.ID} value={t.ID}>
                  {t.ThName}
                </MenuItem>
              ))}
            </TextField>
            <Box display="flex" gap={2}>
              <Button 
                variant="contained" 
                onClick={handleUpdate}
                sx={{ flex: 1 }}
              >
                Сохранить
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setEditMode(false)}
                sx={{ flex: 1 }}
              >
                Отмена
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
});

export default ManagerProfile;