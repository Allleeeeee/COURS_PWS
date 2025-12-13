import { useState, useContext, useEffect } from "react";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  MenuItem,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const CreateManager = observer(({onSuccess}) => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    phone_number: "",
    theatre_id: "",
    additional_info: ""
  });
  
  const [theatres, setTheatres] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [sucMessage, setSucMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    phone_number: '',
    theatre_id: ''
  });

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        const response = await store.getTheatres();
        setTheatres(response);
      } catch (err) {
        console.error("Ошибка загрузки театров:", err);
      }
    };
    fetchTheatres();
  }, [store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Имя обязательно';
    if (!formData.surname.trim()) newErrors.surname = 'Фамилия обязательна';
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Телефон обязателен';
    } else if (!/^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Формат: +375(XX)XXX-XX-XX';
    }
    if (!formData.theatre_id) newErrors.theatre_id = 'Выберите театр';
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSucMessage('');
    
    if (!validateForm()) return;
  
    try {
      await store.addManager(
        formData.email,
        formData.password,
        formData.name,
        formData.surname,
        formData.phone_number,
        formData.theatre_id,
        formData.additional_info
      );
      
   
      setFormData({
        email: "",
        password: "",
        name: "",
        surname: "",
        phone_number: "",
        theatre_id: "",
        additional_info: ""
      });
      
      setSucMessage("Менеджер успешно добавлен!");
      onSuccess(); 
      setTimeout(() => setSucMessage(''), 3000);
    } catch (err) {
      setSucMessage("");
      
      // Обработка ошибок валидации с сервера
      if (err.response?.data?.errors) {
        const serverErrors = {};
        
        // Преобразуем массив ошибок в объект с ключами по именам полей
        err.response.data.errors.forEach(error => {
          if (error.path) {
            serverErrors[error.path] = error.msg;
          }
        });
        
        setFieldErrors(prev => ({
          ...prev,
          ...serverErrors
        }));
        
        // Если есть ошибки, не привязанные к конкретным полям
        if (err.response.data.message) {
          setErrorMessage(err.response.data.message);
        }
      } else if (err.response?.data?.message) {
        // Обработка других ошибок (например, "Пользователь с таким email уже существует")
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("Ошибка при добавлении менеджера");
      }
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
      color: 'white'
    },
    '& .MuiInputLabel-root': { 
      color: '#aaa',
      '&.Mui-focused': { color: '#d32f2f' }
    },
    '& .MuiFormHelperText-root': {
      color: '#d32f2f'
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4,
      backgroundColor: '#2a2a2a',
      borderRadius: 2,
      maxWidth: 600,
      mx: 'auto'
    }}>
      <Typography variant="h5" sx={{ 
        color: 'white',
        mb: 3,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Добавить менеджера
      </Typography>

      {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}
      {sucMessage && <Alert severity="success" sx={{ mb: 3 }}>{sucMessage}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 2 }}>
        <TextField
          name="name"
          label="Имя"
          value={formData.name}
          onChange={handleChange}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          sx={inputStyles}
        />
        <TextField
          name="surname"
          label="Фамилия"
          value={formData.surname}
          onChange={handleChange}
          error={!!fieldErrors.surname}
          helperText={fieldErrors.surname}
          sx={inputStyles}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          sx={inputStyles}
        />
        <TextField
          name="phone_number"
          label="Номер телефона"
          value={formData.phone_number}
          onChange={handleChange}
          error={!!fieldErrors.phone_number}
          helperText={fieldErrors.phone_number}
          sx={inputStyles}
        />
        <TextField
          name="password"
          label="Пароль"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          sx={inputStyles}
        />
        <TextField
          name="theatre_id"
          select
          label="Театр назначения"
          value={formData.theatre_id}
          onChange={handleChange}
          error={!!fieldErrors.theatre_id}
          helperText={fieldErrors.theatre_id}
          sx={inputStyles}
        >
          {theatres.length > 0 ? (
            theatres.map((theatre) => (
              <MenuItem 
                key={theatre.ID} 
                value={theatre.ID}
                sx={{
                  color: 'white',
                  backgroundColor: '#2a2a2a',
                  '&:hover': { backgroundColor: '#333' }
                }}
              >
                {theatre.ThName}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled sx={{ color: '#aaa' }}>
              Нет доступных театров
            </MenuItem>
          )}
        </TextField>
      </Box>

      <TextField
        fullWidth
        name="additional_info"
        label="Дополнительная информация"
        value={formData.additional_info}
        onChange={handleChange}
        multiline
        rows={3}
        sx={{
          ...inputStyles,
          mt: 2
        }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        sx={{
          mt: 3,
          py: 1.5,
          backgroundColor: '#d32f2f',
          '&:hover': { backgroundColor: '#b71c1c' }
        }}
      >
        Добавить менеджера
      </Button>
    </Paper>
  );
});

export default CreateManager;