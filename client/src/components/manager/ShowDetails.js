import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Context } from "../..";
import { 
  TextField, Button, Typography, Container, Alert, Paper,
  Box, Avatar, Divider, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemAvatar, ListItemText, IconButton, Snackbar, MenuItem,
  FormControl, InputLabel, Select
} from "@mui/material";
import { 
  TheaterComedy, Edit, Delete, Save, Close, Add, Person 
} from "@mui/icons-material";
import { getYandexDiskFileUrl } from "./yandex/disk";
import { observer } from "mobx-react-lite";
import ManagerHeader from "./ManagerHeader";

const ShowDetails = observer(() => {
  const genres = ["Драма", "Комедия", "Мюзикл", "Фантастика", "Военное"];
  const ageRestrictions = ["0+", "6+", "12+", "16+", "18+"];
  const { id } = useParams();
  const navigate = useNavigate();
  const { store } = useContext(Context);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [imageUrl, setImageUrl] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [allActors, setAllActors] = useState([]);
  const [selectedActors, setSelectedActors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [currentActor, setCurrentActor] = useState(null);
  const [role, setRole] = useState("");

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
      color: 'white',
      '& input': { color: 'white' }
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
    const fetchData = async () => {
      try {
        const [showData, actorsData] = await Promise.all([
          store.getShowsWithDetailsById(id),
          store.getActors()
        ]);
        
        // Инициализируем show со всеми полями
        if (showData) {
          setShow({
            ...showData,
            duration: showData.duration || "", // Преобразуем null/undefined в пустую строку
            partsCount: showData.partsCount || "1", // Преобразуем в строку
            ageRestriction: showData.ageRestriction || ""
          });
        }
        
        // Загрузка изображений для всех актеров
        const actorsWithImagesPromises = actorsData.map(async (actor) => {
          if (actor.Photo) {
            try {
              const filePath = actor.Photo.replace("https://webdav.yandex.ru", "");
              const url = await getYandexDiskFileUrl(filePath);
              return { 
                id: actor.Cast_id,
                name: actor.Name,
                surname: actor.Surname,
                description: actor.Description,
                photo: url
              };
            } catch (error) {
              console.error("Error loading image for actor:", actor.Name, error);
              return { 
                id: actor.Cast_id,
                name: actor.Name,
                surname: actor.Surname,
                description: actor.Description,
                photo: ""
              };
            }
          }
          return { 
            id: actor.Cast_id,
            name: actor.Name,
            surname: actor.Surname,
            description: actor.Description,
            photo: ""
          };
        });
  
        const actorsWithImages = await Promise.all(actorsWithImagesPromises);
        setAllActors(actorsWithImages);
  
        // Устанавливаем выбранных актеров с загрузкой их фото
        if (showData && showData.actors && Array.isArray(showData.actors)) {
          const selectedActorsWithImages = await Promise.all(
            showData.actors.map(async (actor) => {
              let photoUrl = "";
              if (actor.photo) {
                try {
                  const filePath = actor.photo.replace("https://webdav.yandex.ru", "");
                  photoUrl = await getYandexDiskFileUrl(filePath);
                } catch (error) {
                  console.error("Error loading selected actor image:", actor.name, error);
                }
              }
              return {
                id: actor.id,
                name: actor.name,
                surname: actor.surname,
                photo: photoUrl,
                role: actor.role
              };
            })
          );
          setSelectedActors(selectedActorsWithImages);
        }
  
        // Загрузка постера
        if (showData && showData.poster) {
          const filePath = showData.poster.replace("https://webdav.yandex.ru", "");
          const url = await getYandexDiskFileUrl(filePath);
          setImageUrl(url);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setAlert({ open: true, message: "Ошибка загрузки данных", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, store]);

  const handleUpdate = async () => {
    try {
      if (!show) return;

      // Валидация новых полей
      if (show.duration && (isNaN(parseInt(show.duration)) || parseInt(show.duration) <= 0)) {
        setAlert({ 
          open: true, 
          message: "Длительность должна быть положительным числом (в минутах)", 
          severity: "error" 
        });
        return;
      }
      
      if (isNaN(parseInt(show.partsCount)) || parseInt(show.partsCount) < 1) {
        setAlert({ 
          open: true, 
          message: "Количество частей должно быть положительным числом", 
          severity: "error" 
        });
        return;
      }
      
      if (show.ageRestriction && !/^\d{1,2}\+$/.test(show.ageRestriction)) {
        setAlert({ 
          open: true, 
          message: "Возрастное ограничение должно быть в формате '12+', '16+', '18+' и т.д.", 
          severity: "error" 
        });
        return;
      }

      const actorIds = selectedActors.map(actor => actor.id);
      const roles = selectedActors.map(actor => actor.role);

      await store.updateShow(
        show.id,
        store.user.id,
        show.title,
        show.genre,
        show.description,
        show.theatre.id,
        newImage || show.poster,
        show.start_price || 0,
        actorIds,
        roles,
        show.duration ? parseInt(show.duration) : null,
        parseInt(show.partsCount),
        show.ageRestriction || null
      );
      
      setAlert({ open: true, message: "Данные успешно обновлены!", severity: "success" });
      setTimeout(() => navigate("/allShows"), 1000);
    } catch (err) {
      console.error("Ошибка обновления:", err);
      setAlert({ 
        open: true, 
        message: err.response?.data?.message || "Ошибка обновления", 
        severity: "error" 
      });
    }
  };

  const handleDelete = async () => {
    try {
      await store.deleteShow(show.id, store.user.id);
      setAlert({ open: true, message: "Постановка удалена!", severity: "success" });
      setTimeout(() => navigate("/allShows"), 1000);
    } catch (err) {
      setAlert({ open: true, message: "Ошибка удаления", severity: "error" });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageUrl(null);
      setNewImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddActor = (actor) => {
    setCurrentActor(actor);
    setOpenDialog(true);
  };

  const handleRemoveActor = (actorId) => {
    setSelectedActors(prev => prev.filter(a => a.id !== actorId));
  };

  const handleOpenImageDialog = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const handleConfirmRole = () => {
    if (!role) {
      setAlert({ open: true, message: "Введите роль актера", severity: "error" });
      return;
    }
  
    setSelectedActors([
      ...selectedActors,
      {
        id: currentActor.id,
        name: currentActor.name,
        surname: currentActor.surname,
        photo: currentActor.photo,
        role
      }
    ]);
    setRole("");
    setOpenDialog(false);
  };

  const handleActorRoleChange = (actorId, newRole) => {
    setSelectedActors(prev => 
      prev.map(actor => 
        actor.id === actorId ? { ...actor, role: newRole } : actor
      )
    );
  };

  const handleChange = (field, value) => {
    setShow(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={4}>
      <CircularProgress sx={{ color: '#d32f2f' }} />
    </Box>
  );

  if (!show) return (
    <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', mt: 4 }}>
      Постановка не найдена
    </Typography>
  );

  const availableActors = allActors.filter(actor => 
    !selectedActors.some(selected => selected.id === actor.id)
  );

  return (
    <>
      <ManagerHeader/>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ 
          p: 4,
          backgroundColor: '#2a2a2a',
          borderRadius: 2
        }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ 
              bgcolor: '#d32f2f',
              width: 56,
              height: 56,
              mr: 2
            }}>
              <TheaterComedy fontSize="large" />
            </Avatar>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
              {show.title}
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: '#444', mb: 4 }} />

          {alert.open && (
            <Alert 
              onClose={() => setAlert({ ...alert, open: false })} 
              severity={alert.severity}
              sx={{ mb: 3 }}
            >
              {alert.message}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField 
              label="Название" 
              value={show.title} 
              onChange={(e) => handleChange('title', e.target.value)} 
              fullWidth 
              required
              sx={inputStyles}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <TextField
                select
                label="Жанр"
                value={show.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                fullWidth
                required
                sx={inputStyles}
              >
                {genres.map((genre) => (
                  <MenuItem 
                    key={genre} 
                    value={genre}
                    sx={menuItemStyles}
                  >
                    {genre}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField 
                label="Начальная цена" 
                type="number"
                value={show.start_price || ''} 
                onChange={(e) => handleChange('start_price', Number(e.target.value))} 
                fullWidth 
                sx={inputStyles}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
              
              <TextField 
                label="Длительность (в минутах)" 
                type="number"
                value={show.duration} 
                onChange={(e) => handleChange('duration', e.target.value)} 
                fullWidth 
                sx={inputStyles}
                InputProps={{ inputProps: { min: 0 } }}
                placeholder="120"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
              <TextField 
                label="Количество частей" 
                type="number"
                value={show.partsCount} 
                onChange={(e) => handleChange('partsCount', e.target.value)} 
                fullWidth 
                required
                sx={inputStyles}
                InputProps={{ inputProps: { min: 1 } }}
              />
              
              <FormControl fullWidth sx={inputStyles}>
                <InputLabel>Возрастное ограничение</InputLabel>
                <Select 
                  value={show.ageRestriction} 
                  onChange={(e) => handleChange('ageRestriction', e.target.value)} 
                  label="Возрастное ограничение"
                >
                  <MenuItem value="" sx={menuItemStyles}>
                    <em>Не указано</em>
                  </MenuItem>
                  {ageRestrictions.map((age) => (
                    <MenuItem key={age} value={age} sx={menuItemStyles}>{age}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField 
              label="Описание" 
              value={show.description} 
              onChange={(e) => handleChange('description', e.target.value)} 
              fullWidth 
              multiline
              rows={4}
              sx={inputStyles}
            />

            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Постер
              </Typography>
              
              {(imageUrl || previewUrl) && (
                <Box sx={{ 
                  mb: 2,
                  border: '1px solid #444',
                  borderRadius: 1,
                  overflow: 'hidden',
                  maxWidth: 400,
                  cursor: 'pointer'
                }} onClick={() => handleOpenImageDialog(previewUrl || imageUrl)}>
                  <img 
                    src={previewUrl || imageUrl} 
                    alt="Постер" 
                    style={{ 
                      width: '100%',
                      display: 'block'
                    }} 
                  />
                </Box>
              )}

              <Button 
                variant="contained" 
                component="label"
                sx={{
                  backgroundColor: '#424242',
                  '&:hover': { backgroundColor: '#616161' },
                  py: 1.5
                }}
              >
                Загрузить новое изображение
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </Button>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Актёрский состав
                </Typography>
              </Box>

              <List sx={{ 
                maxHeight: 200, 
                overflow: 'auto', 
                border: '1px solid #444', 
                borderRadius: 1,
                mb: 2
              }}>
                {availableActors.map((actor) => (
                  <ListItem 
                    key={actor.id} 
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleAddActor(actor)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <Add />
                      </IconButton>
                    }
                    sx={{ borderBottom: '1px solid #444' }}
                  >
                    <ListItemAvatar>
                      <IconButton onClick={() => actor.photo && handleOpenImageDialog(actor.photo)}>
                        <Avatar 
                          src={actor.photo || "/default-avatar.png"} 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            cursor: actor.photo ? 'pointer' : 'default',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: actor.photo ? 'scale(1.1)' : 'none'
                            }
                          }} 
                        />
                      </IconButton>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={`${actor.name} ${actor.surname}`} 
                      sx={{ 
                        '& .MuiTypography-root': {
                          color: 'white !important'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              {selectedActors.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                    Выбранные актеры:
                  </Typography>
                  <List>
                    {selectedActors.map((actor) => (
                      <ListItem 
                        key={actor.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveActor(actor.id)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Close />
                          </IconButton>
                        }
                        sx={{ borderBottom: '1px solid #444' }}
                      >
                        <ListItemAvatar>
                          <IconButton onClick={() => actor.photo && handleOpenImageDialog(actor.photo)}>
                            <Avatar 
                              src={actor.photo || "/default-avatar.png"} 
                              sx={{ 
                                width: 56, 
                                height: 56,
                                cursor: actor.photo ? 'pointer' : 'default',
                                transition: 'transform 0.3s',
                                '&:hover': {
                                  transform: actor.photo ? 'scale(1.1)' : 'none'
                                }
                              }} 
                            />
                          </IconButton>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={`${actor.name} ${actor.surname}`} 
                          secondary={
                            <TextField
                              value={actor.role}
                              onChange={(e) => handleActorRoleChange(actor.id, e.target.value)}
                              size="small"
                              sx={{
                                ...inputStyles,
                                '& .MuiOutlinedInput-root': { 
                                  height: 32,
                                  '& input': { color: 'white' }
                                },
                                '& .MuiInputBase-input': { py: 0.5 }
                              }}
                            />
                          }
                          sx={{ 
                            '& .MuiTypography-root': {
                              color: 'white !important'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleUpdate}
                startIcon={<Save />}
                sx={{
                  backgroundColor: '#d32f2f',
                  '&:hover': { backgroundColor: '#b71c1c' },
                  py: 1.5,
                  flex: 1
                }}
              >
                Сохранить изменения
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={handleDelete}
                startIcon={<Delete />}
                sx={{
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': { borderColor: '#b71c1c' },
                  py: 1.5,
                  flex: 1
                }}
              >
                Удалить постановку
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Диалог для указания роли актера */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{ sx: { bgcolor: '#2a2a2a', color: 'white' } }}
      >
        <DialogTitle>
          Укажите роль для {currentActor?.name} {currentActor?.surname}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Роль"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={inputStyles}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ color: '#aaa' }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleConfirmRole}
            sx={{ color: '#d32f2f' }}
            disabled={!role}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для увеличенного фото */}
      <Dialog 
        open={openImageDialog} 
        onClose={handleCloseImageDialog}
        maxWidth="md"
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
          }
        }}
        PaperProps={{ sx: { backgroundColor: 'transparent', boxShadow: 'none' } }}
      >
        <DialogContent sx={{ padding: 0 }}>
          <img 
            src={selectedImage} 
            alt="Увеличенное фото" 
            style={{ 
              width: '100%', 
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#2a2a2a' }}>
          <Button 
            onClick={handleCloseImageDialog} 
            sx={{ color: '#d32f2f' }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </>
  );
});

export default ShowDetails;