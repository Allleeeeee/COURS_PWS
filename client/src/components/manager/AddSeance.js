import { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../..";
import { 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Alert, 
  Snackbar, 
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress
} from "@mui/material";
import ManagerHeader from "./ManagerHeader";

const AddSeance = observer(() => {
  const statusMass = ['Не проведён'];
  const { store } = useContext(Context);
  const [theatreId, setTheatreId] = useState("");
  const [showId, setShowId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("");
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [theatre, setTheatre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

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
    '& .MuiSelect-icon': { color: '#aaa' }
  };

  const menuItemStyles = {
    color: 'white',
    backgroundColor: '#2a2a2a',
    '&:hover': { backgroundColor: '#333' },
    '&.Mui-selected': { backgroundColor: '#d32f2f' }
  };

  useEffect(() => {
    const fetchTheatre = async () => {
      try {
        const th = await store.getTheatreByManager(store.user.id);
        setTheatre(th);
        if (th) {
          setTheatreId(th.ID);
          const shows = await store.getShowsByTheatre(th.ID);
          setShows(shows);
        }
      } catch (err) {
        console.error("Ошибка загрузки театра:", err);
        setError("Ошибка загрузки театра");
      }
    };
    fetchTheatre();
  }, [store]);

  useEffect(() => {
    const fetchShows = async () => {
      if (!theatreId) {
        setShows([]);
        return;
      }
      try {
        const filteredShows = await store.getShowsByTheatre(theatreId);
        setShows(filteredShows);
      } catch (err) {
        console.error("Ошибка загрузки шоу по театру:", err);
        setError("Ошибка загрузки шоу");
        setShows([]);
      }
    };
    fetchShows();
  }, [theatreId, store]);

  // Функция для добавления минут к дате
  const addMinutesToTime = (dateTimeString, minutes) => {
    if (!dateTimeString || !minutes) return "";
    
    const date = new Date(dateTimeString);
    date.setMinutes(date.getMinutes() + minutes);
    
    // Форматируем обратно в строку для input[type="datetime-local"]
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutesStr = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutesStr}`;
  };

  // Обработчик изменения выбранного шоу
  const handleShowChange = async (selectedShowId) => {
    setShowId(selectedShowId);
    
    // Если выбрано время начала, обновляем время окончания
    if (selectedShowId && startTime) {
      await updateEndTime(selectedShowId, startTime);
    }
  };

  // Обработчик изменения времени начала
  const handleStartTimeChange = async (newStartTime) => {
    setStartTime(newStartTime);
    
    // Если выбран шоу, обновляем время окончания
    if (showId && newStartTime) {
      await updateEndTime(showId, newStartTime);
    }
  };

  // Функция обновления времени окончания
  const updateEndTime = async (showIdToCheck, startTimeToUse) => {
    if (!showIdToCheck || !startTimeToUse) return;
    
    setIsLoadingDuration(true);
    try {
      // Получаем длительность шоу
      const duration = await store.getShowDuration(showIdToCheck);
      
      if (duration && duration > 0) {
        // Добавляем длительность ко времени начала
        const calculatedEndTime = addMinutesToTime(startTimeToUse, duration);
        setEndTime(calculatedEndTime);
        
        // Также можно добавить время на антракты, если есть partsCount > 1
        const show = shows.find(s => s.ID === showIdToCheck);
        if (show && show.partsCount > 1) {
          // Добавляем 15 минут на каждый антракт (можно настроить)
          const intermissionMinutes = (show.partsCount - 1) * 15;
          const endWithIntermissions = addMinutesToTime(startTimeToUse, duration + intermissionMinutes);
          setEndTime(endWithIntermissions);
        }
      } else {
        // Если длительность не указана, очищаем поле
        setEndTime("");
      }
    } catch (err) {
      console.error("Ошибка при получении длительности шоу:", err);
      setEndTime("");
    } finally {
      setIsLoadingDuration(false);
    }
  };

  const handleSubmit = async () => {
    if (!theatre?.ID || !showId || !startTime || !endTime || !status) {
      setError("Пожалуйста, заполните все поля");
      return;
    }
  
    try {
      await store.addSeance(theatre.ID, store.user.id, showId, startTime, endTime, status);
      setSuccess(true);
      setShowId("");
      setStartTime("");
      setEndTime("");
      setStatus("");
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка при добавлении сеанса");
    }
  };

  return (
    <>
    <ManagerHeader/>
    <Paper elevation={3} sx={{ 
      p: 4,
      backgroundColor: '#2a2a2a',
      borderRadius: 2,
      maxWidth: 600,
      mx: 'auto',
      mt: 4
    }}>
      <Typography variant="h5" sx={{ 
        color: 'white',
        mb: 3,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Добавить новый сеанс
      </Typography>

      <Divider sx={{ mb: 3, bgcolor: '#444' }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl fullWidth sx={inputStyles}>
          <InputLabel sx={{ color: '#aaa !important' }}>Театр</InputLabel>
          <Select 
            value={theatre?.ID || ''} 
            label="Театр"
            disabled
            sx={{
              color: 'white !important',
              '& .Mui-disabled': {
                color: 'white !important',
                WebkitTextFillColor: 'white !important'
              },
              '& .MuiSelect-icon': { color: '#aaa' }
            }}
          >
            {theatre ? (
              <MenuItem value={theatre.ID} sx={menuItemStyles}>
                {theatre.ThName}
              </MenuItem>
            ) : (
              <MenuItem disabled sx={menuItemStyles}>
                Загрузка театра...
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={inputStyles}>
          <InputLabel>Спектакль</InputLabel>
          <Select 
            value={showId} 
            onChange={(e) => handleShowChange(e.target.value)} 
            label="Спектакль"
            disabled={!theatre}
          >
            {shows.map((show) => (
              <MenuItem key={show.ID} value={show.ID} sx={menuItemStyles}>
                {show.Title} {show.duration ? `(${Math.floor(show.duration/60)}ч ${show.duration%60}м)` : ''}
              </MenuItem>
            ))}
            {shows.length === 0 && (
              <MenuItem disabled sx={menuItemStyles}>
                {theatre ? "Нет доступных спектаклей" : "Загрузка спектаклей..."}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
          <TextField
            label="Время начала"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            fullWidth
            sx={inputStyles}
          />

          <Box sx={{ position: 'relative' }}>
            <TextField
              label="Время окончания"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              sx={inputStyles}
              disabled={isLoadingDuration}
              helperText={isLoadingDuration ? "Вычисление времени..." : "Автоматически рассчитывается"}
            />
            {isLoadingDuration && (
              <CircularProgress 
                size={24} 
                sx={{ 
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#d32f2f'
                }} 
              />
            )}
          </Box>
        </Box>

        <FormControl fullWidth sx={inputStyles}>
          <InputLabel>Статус</InputLabel>
          <Select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            label="Статус"
          >
            {statusMass.map((status) => (
              <MenuItem key={status} value={status} sx={menuItemStyles}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {showId && startTime && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(211, 47, 47, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(211, 47, 47, 0.3)'
          }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              <strong>Примечание:</strong> Время окончания рассчитывается автоматически на основе 
              длительности выбранного спектакля. Вы можете изменить его вручную при необходимости.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isLoadingDuration}
          sx={{
            mt: 2,
            py: 1.5,
            backgroundColor: '#d32f2f',
            '&:hover': { backgroundColor: '#b71c1c' }
          }}
        >
          Добавить сеанс
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Сеанс успешно добавлен!
        </Alert>
      </Snackbar>
    </Paper>
    </>
  );
});

export default AddSeance;