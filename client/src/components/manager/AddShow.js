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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import ManagerHeader from "./ManagerHeader";
import { getYandexDiskFileUrl } from "./yandex/disk";

const genres = ["Драма", "Комедия", "Мюзикл", "Фантастика", "Военное"];
const ageRestrictions = ["0+", "6+", "12+", "16+", "18+"];

const AddShow = observer(() => {
  const { store } = useContext(Context);
  
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [start_price, setStart_price] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [castMembers, setCastMembers] = useState([]); // все члены каста
  const [selectedCast, setSelectedCast] = useState([]); // выбранные участники
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [role, setRole] = useState("");
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Новые поля
  const [duration, setDuration] = useState("");
  const [partsCount, setPartsCount] = useState("1");
  const [ageRestriction, setAgeRestriction] = useState("");
  
  // Для табов
  const [activeTab, setActiveTab] = useState(0);
  
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  // Группировка участников по RoleType
  const groupedCast = {
    actor: [],    // актеры
    director: [], // режиссеры
    playwright: [], // драматурги
    other: []     // другие
  };

  // Заполняем группы
  castMembers.forEach(person => {
    if (groupedCast[person.roleType]) {
      groupedCast[person.roleType].push(person);
    } else {
      groupedCast.other.push(person);
    }
  });

  // Маппинг RoleType для отображения
  const roleTypeLabels = {
    actor: 'Актёры',
    director: 'Руководители',
    playwright: 'Режиссёры',
    other: 'Другие участники'
  };

  // Маппинг RoleType для отображения текста
  const roleTypeTextMap = {
    actor: 'Актёр',
    director: 'Режиссёр',
    playwright: 'Драматург',
    other: 'Участник'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [theatreResponse, castResponse] = await Promise.all([
          store.getTheatreByManager(store.user.id),
          store.getCast() // получаем всех участников каста
        ]);
        
        setTheatre(theatreResponse);
        
        const castWithImagesPromises = castResponse.map(async (person) => {
          if (person.Photo) {
            try {
              const filePath = person.Photo.replace("https://webdav.yandex.ru", "");
              const url = await getYandexDiskFileUrl(filePath);
              return { 
                id: person.Cast_id,
                name: person.Name,
                surname: person.Surname,
                description: person.Description,
                photo: url,
                roleType: person.RoleType,
                roleTypeText: person.RoleTypeText || roleTypeTextMap[person.RoleType] || 'Участник',
                theatre: person.Theatre
              };
            } catch (error) {
              console.error("Error loading image for cast member:", person.Name, error);
              return { 
                id: person.Cast_id,
                name: person.Name,
                surname: person.Surname,
                description: person.Description,
                photo: "",
                roleType: person.RoleType,
                roleTypeText: person.RoleTypeText || roleTypeTextMap[person.RoleType] || 'Участник',
                theatre: person.Theatre
              };
            }
          }
          return { 
            id: person.Cast_id,
            name: person.Name,
            surname: person.Surname,
            description: person.Description,
            photo: "",
            roleType: person.RoleType,
            roleTypeText: person.RoleTypeText || roleTypeTextMap[person.RoleType] || 'Участник',
            theatre: person.Theatre
          };
        });
  
        const castWithImages = await Promise.all(castWithImagesPromises);
        setCastMembers(castWithImages);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setAlert({ open: true, message: "Ошибка загрузки данных", severity: "error" });
      }
    };
    fetchData();
  }, [store]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };
  
  const handleOpenImageDialog = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageDialog(true);
  };
  
  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const handleAddPerson = (person) => {
    // Если это актер - открываем диалог для ввода роли
    if (person.roleType === 'actor') {
      setCurrentPerson(person);
      setOpenDialog(true);
    } else {
      // Для не-актеров используем их roleTypeText как роль
      setSelectedCast([
        ...selectedCast,
        {
          id: person.id,
          name: person.name,
          surname: person.surname,
          photo: person.photo,
          roleType: person.roleType,
          role: person.roleTypeText // используем roleTypeText как роль
        }
      ]);
    }
  };

  const handleRemovePerson = (personId) => {
    setSelectedCast(prev => prev.filter(p => p.id !== personId));
  };

  const handleConfirmRole = () => {
    if (!role && currentPerson?.roleType === 'actor') {
      setAlert({ open: true, message: "Введите роль актера", severity: "error" });
      return;
    }
  
    setSelectedCast([
      ...selectedCast,
      {
        id: currentPerson.id,
        name: currentPerson.name,
        surname: currentPerson.surname,
        photo: currentPerson.photo,
        roleType: currentPerson.roleType,
        role: role || currentPerson.roleTypeText
      }
    ]);
    setRole("");
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCast.length === 0) {
      setAlert({ 
        open: true, 
        message: "Добавьте хотя бы одного участника для постановки!", 
        severity: "error" 
      });
      return;
    }

    if (!title || !genre || !description || !theatre  || !start_price) {
      setAlert({ open: true, message: "Все обязательные поля должны быть заполнены!", severity: "error" });
      return;
    }
    
    if (!file) {
      setAlert({ 
        open: true, 
        message: "Пожалуйста, загрузите постер для шоу!", 
        severity: "error" 
      });
      return;
    }
    
    // Валидация Duration
    if (duration && (isNaN(parseInt(duration)) || parseInt(duration) <= 0)) {
      setAlert({ 
        open: true, 
        message: "Длительность должна быть положительным числом (в минутах)", 
        severity: "error" 
      });
      return;
    }
    
    // Валидация AgeRestriction
    if (ageRestriction && !/^\d{1,2}\+$/.test(ageRestriction)) {
      setAlert({ 
        open: true, 
        message: "Возрастное ограничение должно быть в формате '12+', '16+', '18+' и т.д.", 
        severity: "error" 
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Создаем массивы для отправки
      const actorIds = selectedCast.map(p => Number(p.id));
      const roles = selectedCast.map(p => p.role);
      
      await store.addShow(
        store.user.id,
        title, 
        genre, 
        description, 
        0, 
        theatre.ID, 
        file, 
        start_price, 
        actorIds, 
        roles,
        duration ? parseInt(duration) : null,
        parseInt(partsCount),
        ageRestriction || null
      );
      
      setAlert({ open: true, message: "Шоу успешно добавлено!", severity: "success" });
      resetForm();
    } catch (error) {
      setAlert({ open: true, message: error.response?.data?.message || "Ошибка при добавлении шоу", severity: "error" });
    } finally {
      setIsLoading(false); 
    }
  };

  const resetForm = () => {
    setTitle("");
    setRating("");
    setGenre("");
    setDescription("");
    setTheatreId("");
    setStart_price("");
    setFile(null);
    setPreviewUrl(null);
    setSelectedCast([]);
    // Сброс новых полей
    setDuration("");
    setPartsCount("1");
    setAgeRestriction("");
    setActiveTab(0);
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
      color: 'white',
      '& input': {  
        color: 'white',
      },
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

  // Проверяем, выбран ли уже участник
  const isPersonSelected = (personId) => {
    return selectedCast.some(p => p.id === personId);
  };

  return (
    <>
      <ManagerHeader/>
      <Paper elevation={3} sx={{ 
        p: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        maxWidth: 800,
        mx: 'auto',
        mt: 4
      }}>
        <Typography variant="h5" sx={{ 
          color: 'white',
          mb: 3,
          fontWeight: 600,
          textAlign: 'center'
        }}>
          Добавить новое шоу
        </Typography>

        <Divider sx={{ mb: 3, bgcolor: '#444' }} />

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3 
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
            <TextField 
              label="Название шоу" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              sx={inputStyles}
            />
            
            <FormControl fullWidth required sx={inputStyles}>
              <InputLabel>Жанр</InputLabel>
              <Select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)} 
                label="Жанр"
              >
                {genres.map((g) => (
                  <MenuItem key={g} value={g} sx={menuItemStyles}>{g}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField 
            label="Описание" 
            multiline 
            rows={4} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required
            sx={inputStyles}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr 1fr' }, gap: 3 }}>
            <TextField 
              label="Стартовая цена" 
              type="number" 
              value={start_price} 
              onChange={(e) => setStart_price(e.target.value)}
              required
              sx={inputStyles}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
            
            <TextField 
              label="Длительность (в минутах)" 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              sx={inputStyles}
              InputProps={{ inputProps: { min: 0 } }}
              placeholder="120"
            />
            
            <TextField 
              label="Количество частей" 
              type="number" 
              value={partsCount} 
              onChange={(e) => {
                const value = e.target.value;
                // Разрешаем только положительные целые числа
                if (value === "" || /^[1-9]\d*$/.test(value)) {
                  setPartsCount(value);
                }
              }}
              required
              sx={inputStyles}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
            <TextField 
              label="Театр" 
              value={theatre ? theatre.ThName : "Загрузка..."} 
              InputProps={{
                readOnly: true,
              }}
              sx={inputStyles}
            />
            
            <FormControl fullWidth sx={inputStyles}>
              <InputLabel>Возрастное ограничение</InputLabel>
              <Select 
                value={ageRestriction} 
                onChange={(e) => setAgeRestriction(e.target.value)} 
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

          <Button 
            variant="contained" 
            component="label"
            sx={{
              backgroundColor: '#424242',
              '&:hover': { backgroundColor: '#616161' },
              py: 1.5
            }}
          >
            Загрузить изображение
            <input type="file" accept="image/*" hidden onChange={handleFileChange} required />
          </Button>

          {previewUrl && (
            <Box mt={2} display="flex" justifyContent="center">
              <img 
                src={previewUrl} 
                alt="Предпросмотр" 
                style={{ 
                  width: '100%', 
                  maxWidth: '300px', 
                  borderRadius: '8px',
                  border: '1px solid #444'
                }} 
              />
            </Box>
          )}

          <Box mt={2}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Выберите участников постановки
            </Typography>
            
            {/* Табы для разных типов участников */}
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: '#444',
                mb: 2
              }}
              TabIndicatorProps={{
                style: { backgroundColor: '#d32f2f' }
              }}
            >
              {Object.entries(groupedCast).map(([type, members]) => (
                members.length > 0 && (
                  <Tab 
                    key={type}
                    label={`${roleTypeLabels[type] || type} (${members.length})`}
                    sx={{ 
                      color: 'white',
                      '&.Mui-selected': { color: '#d32f2f' }
                    }}
                  />
                )
              ))}
            </Tabs>
            
            {/* Список участников для активной вкладки */}
            {Object.entries(groupedCast).map(([type, members], index) => (
              activeTab === index && (
                <List 
                  key={type}
                  sx={{ 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #444', 
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  {members.map((person) => (
                    <ListItem 
                      key={person.id} 
                      secondaryAction={
                        !isPersonSelected(person.id) && (
                          <IconButton 
                            edge="end" 
                            onClick={() => handleAddPerson(person)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Add />
                          </IconButton>
                        )
                      }
                      sx={{ 
                        borderBottom: '1px solid #444',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <ListItemAvatar>
                        <IconButton onClick={() => person.photo && handleOpenImageDialog(person.photo)}>
                          <Avatar 
                            src={person.photo || "/default-avatar.png"} 
                            sx={{ 
                              width: 56, 
                              height: 56,
                              cursor: person.photo ? 'pointer' : 'default'
                            }} 
                          />
                        </IconButton>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${person.name} ${person.surname}`}
                        secondary={person.roleTypeText}
                        sx={{ 
                          '& .MuiTypography-root': {
                            color: 'white !important'
                          },
                          '& .MuiListItemText-secondary': {
                            color: '#aaa !important'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )
            ))}
            
            {selectedCast.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                  Выбранные участники:
                </Typography>
                <List>
                  {selectedCast.map((person) => (
                    <ListItem 
                      key={person.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => handleRemovePerson(person.id)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <Close />
                        </IconButton>
                      }
                      sx={{ borderBottom: '1px solid #444' }}
                    >
                      <ListItemAvatar>
                        <Avatar src={person.photo || "/default-avatar.png"} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${person.name} ${person.surname}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                              Роль: {person.role}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Тип: {person.roleTypeText}
                            </Typography>
                          </Box>
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

          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            sx={{
              mt: 2,
              py: 1.5,
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />                    
            ) : (
              "Добавить шоу"
            )}
          </Button>
        </Box>
        
        <Dialog 
          open={openImageDialog} 
          onClose={handleCloseImageDialog}
          maxWidth="md"
        >
          <DialogContent sx={{ backgroundColor: '#2a2a2a' }}>
            <img 
              src={selectedImage} 
              alt="Увеличенное фото" 
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }} 
            />
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#2a2a2a' }}>
            <Button onClick={handleCloseImageDialog} sx={{ color: '#d32f2f', backgroundColor:'#2a2a2a' }}>
              Закрыть
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Диалог для ввода роли актера */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
            Укажите роль для {currentPerson?.name} {currentPerson?.surname}
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: '#2a2a2a' }}>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
              (актер)
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Роль в спектакле"
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={inputStyles}
              placeholder="Например: Гамлет, Офелия"
            />
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#2a2a2a' }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: '#aaa' }}>
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmRole} 
              sx={{ color: '#d32f2f' }}
            >
              Добавить
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
      </Paper>
    </>
  );
});

export default AddShow;