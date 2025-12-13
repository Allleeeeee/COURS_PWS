import { useState, useContext, useEffect } from "react";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import { Container, TextField, Button, Box, Typography, Alert, Paper, Grid } from "@mui/material";
import TheatreCard from "../admin/TheatreCard";
import AddSector from "../admin/AddSector";
import SectorMaket from "../admin/SectorMaket";
import AdminAppBar from "../admin/AdminAppBar";
import DeleteSector from "../admin/DeleteSector";
import YandexMapAdmin from "../admin/YandexMapAdmin";
import ErrorBoundary from "../admin/ErrorBoundary";

const TheatrePage = observer(() => {
  const { store } = useContext(Context);
  const [theatres, setTheatres] = useState([]);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 

  const [thName, setThName] = useState("");
  const [thCity, setThCity] = useState("");
  const [thAddress, setThAddress] = useState("");
  const [thEmail, setThEmail] = useState("");
  const [thPhone, setThPhone] = useState("");
  const [thDescription, setThDescription] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [fieldErrors, setFieldErrors] = useState({
    thName: '',
    thAddress: '',
    thEmail: '',
    thPhone: ''
  });

  const [sucMessage, setSucMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        const response = await store.getTheatres();
        setTheatres(response);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || err.response?.data?.error);
      }
    };
    fetchTheatres();
  }, [store]);

  const handleEditTheatre = (theatre) => {
    if (editingTheatre?.ID === theatre.ID) {
      setEditingTheatre(null);
      resetForm();
      return;
    }
    
    setEditingTheatre(theatre);
    setThName(theatre.ThName);
    setThCity(theatre.ThCity);
    setThAddress(theatre.ThAddress);
    setThEmail(theatre.ThEmail);
    setThPhone(theatre.ThPhone);
    setThDescription(theatre.ThDescription);
    setWorkingHours(theatre.WorkingHours);
    setCoordinates({
      latitude: theatre.ThLatitude,
      longitude: theatre.ThLongitude
    });
    setSucMessage("");
    setErrorMessage("");
  };

  const resetForm = () => {
    setThName("");
    setThCity("");
    setThAddress("");
    setThEmail("");
    setThPhone("");
    setThDescription("");
    setWorkingHours("");
    setCoordinates({ latitude: null, longitude: null });
    setSucMessage("");
    setErrorMessage("");
  };

  const handleSectorChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateTheatre = async () => {
    if (!editingTheatre) return;

    try {
      const validationErrors = validateFields();
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
      console.log("latitude before"+coordinates.latitude);
      console.log("longitude before"+coordinates.longitude);
      await store.updateTheatre(
        editingTheatre.ID,
        thName,
        thCity,
        thAddress,
        thEmail,
        thPhone,
        thDescription,
        workingHours,
        coordinates.latitude,
        coordinates.longitude
      );
      setErrorMessage("");
      setSucMessage("Театр успешно обновлён!");
      setFieldErrors("");
      const updatedTheatres = await store.getTheatres();
      console.log("after"+ JSON.stringify(updatedTheatres,2,null));
      setTheatres(updatedTheatres);
    } catch (err) {
      setSucMessage("");
      setErrorMessage(err.response?.data?.message || err.response?.data?.error||"Ошибка при обновлении театра");
    }
  };

  const handleDeleteTheatre = async () => {
    if (!editingTheatre) return;
    try {
      await store.deleteTheatre(editingTheatre.ID);
      setSucMessage("Театр удалён!");
      setEditingTheatre(null);
      setThName("");
      setThCity("");
      setThAddress("");
      setThEmail("");
      setThPhone("");
      setWorkingHours("");
      setThDescription("");
      
      const updatedTheatres = await store.getTheatres();
      setTheatres(updatedTheatres);
    } catch (err) {
      setSucMessage("");
      setErrorMessage("Ошибка при удалении театра");
    }
  };

  const validateFields = () => {
    const errors = {};
    
    if (!thName.trim()) errors.thName = 'Название театра обязательно';
     if (!thCity.trim()) errors.thCity = 'Город обязателен';
    if (!thAddress.trim() || thAddress.length < 10 || thAddress.length > 50) {
      errors.thAddress = 'Адрес должен быть от 10 до 50 символов';
    }
    if (thEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(thEmail)) {
      errors.thEmail = 'Некорректный email';
    }
    if (thPhone && !/^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/.test(thPhone)) {
      errors.thPhone = 'Телефон должен быть в формате +375(хх)ххх-хх-хх';
    }
    if (!workingHours.trim()) errors.workingHours = 'График работы театра обязателен';
    
    return errors;
  };

  const handleAddTheatre = async () => {
    try {
      const validationErrors = validateFields();
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
      await store.addTheatre(
        thName,
        thCity, 
        thAddress, 
        thEmail, 
        thPhone, 
        thDescription,
        workingHours,
        coordinates.latitude,
        coordinates.longitude
      );
      setSucMessage("Театр успешно добавлен!");
      resetForm();
      const updatedTheatres = await store.getTheatres();
      setTheatres(updatedTheatres);
    } catch (err) {
      setSucMessage("");
      setErrorMessage(err.response?.data?.message ||"Ошибка при добавлении театра");
    }
  };

  const handleMapClick = (coords) => {
    setCoordinates({
      latitude: coords[0],
      longitude: coords[1]
    });
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
    '& .MuiSelect-icon': { color: '#aaa' }
  };

  return (
    <>
      <AdminAppBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Первый ряд - формы работы с театрами */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Форма добавления/редактирования театра */}
          <Grid item xs={12} md={6}>
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
                {editingTheatre ? "Редактировать театр" : "Добавить театр"}
              </Typography>

              {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
              {sucMessage && <Alert severity="success" sx={{ mb: 2 }}>{sucMessage}</Alert>}
                  
              <TextField 
                fullWidth 
                margin="normal" 
                label="Название" 
                value={thName} 
                onChange={(e) => setThName(e.target.value)}
                sx={inputStyles}
                error={!!fieldErrors.thName}
                helperText={fieldErrors.thName}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="Город" 
                value={thCity} 
                onChange={(e) => setThCity(e.target.value)}
                sx={inputStyles}
                error={!!fieldErrors.thCity}
                helperText={fieldErrors.thCity}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="Адрес" 
                value={thAddress} 
                onChange={(e) => setThAddress(e.target.value)}
                sx={inputStyles}
                error={!!fieldErrors.thAddress}
                helperText={fieldErrors.thAddress}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="Email" 
                value={thEmail} 
                onChange={(e) => setThEmail(e.target.value)}
                sx={inputStyles}
                error={!!fieldErrors.thEmail}
                helperText={fieldErrors.thEmail}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="Телефон" 
                value={thPhone} 
                onChange={(e) => setThPhone(e.target.value)}
                sx={inputStyles}
                error={!!fieldErrors.thPhone}
                helperText={fieldErrors.thPhone}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="Описание" 
                value={thDescription} 
                onChange={(e) => setThDescription(e.target.value)}
                multiline
                rows={4}
                sx={inputStyles}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                label="График работы" 
                value={workingHours} 
                error={!!fieldErrors.workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                multiline
                rows={4}
                sx={inputStyles}
              />
              
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Укажите местоположение театра на карте
                </Typography>
                <ErrorBoundary>
                  <YandexMapAdmin 
                    address={thAddress}
                    city={thCity}
                    initialCoords={
                      coordinates.latitude && coordinates.longitude 
                        ? [coordinates.latitude, coordinates.longitude] 
                        : null
                    }
                    onMapClick={handleMapClick}
                    height="300px"
                  />
                </ErrorBoundary>
                {coordinates.latitude && coordinates.longitude && (
                  <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
                    Выбраны координаты: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </Typography>
                )}
              </Box>
              
              {editingTheatre ? (
                <>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleUpdateTheatre}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      backgroundColor: '#d32f2f',
                      '&:hover': { backgroundColor: '#b71c1c' }
                    }}
                  >
                    Сохранить изменения
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={handleDeleteTheatre} 
                    sx={{ 
                      mt: 2,
                      py: 1.5,
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': { borderColor: '#b71c1c' }
                    }}
                  >
                    Удалить театр
                  </Button>
                </>
              ) : (
                <Button 
                  fullWidth 
                  variant="contained"
                  onClick={handleAddTheatre}
                  disabled={!thName || !thAddress}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' },
                    '&:disabled': { backgroundColor: '#555', color: '#888' }
                  }}
                >
                  Добавить театр
                </Button>
              )}
            </Paper>
          </Grid>

          {/* Список театров */}
          {/* Список театров */}
<Grid item xs={12} md={6}>
  <Paper elevation={3} sx={{ 
    p: 3, 
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    height: '100%'
  }}>
    <Typography variant="h5" sx={{ 
      color: 'white',
      mb: 3,
      fontWeight: 600,
      textAlign: 'center'
    }}>
      Список театров
    </Typography>

    <Box sx={{ 
      maxHeight: '600px', 
      overflowY: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#2a2a2a',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#d32f2f',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#b71c1c',
      }
    }}>
      {theatres.map((theatre) => (
        <TheatreCard 
          key={theatre.ID} 
          theatre={theatre} 
          onSelect={handleEditTheatre} 
          isSelected={editingTheatre?.ID === theatre.ID}
        />
      ))}
    </Box>
  </Paper>
</Grid>
        </Grid>

        {/* Второй ряд - формы работы с секторами */}
        <Grid container spacing={4}>
          {/* Форма добавления сектора */}
          <Grid item xs={12} md={6}>
            <AddSector 
              theatres={theatres} 
              selectedTheatreId={editingTheatre?.ID} 
              onSectorChange={handleSectorChange} 
            />
          </Grid>

          {/* Форма удаления сектора */}
          <Grid item xs={12} md={6}>
            <DeleteSector 
              theatres={theatres} 
              selectedTheatreId={editingTheatre?.ID} 
              onSectorChange={handleSectorChange} 
            />
          </Grid>
        </Grid>

        {/* Сектор макета (если выбран театр) */}
        {editingTheatre && (
          <Box mt={4}>
            <SectorMaket key={refreshKey} theatreId={editingTheatre.ID} />
          </Box>
        )}
      </Container>
    </>
  );
});

export default TheatrePage;