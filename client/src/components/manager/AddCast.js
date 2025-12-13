import { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../..";
import { 
  TextField, 
  Button, 
  Alert, 
  Snackbar, 
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip
} from "@mui/material";
import { PersonAdd, PhotoCamera, Business, FilterList } from "@mui/icons-material";
import { getYandexDiskFileUrl } from "./yandex/disk";
import ManagerHeader from "./ManagerHeader";

const AddCast = observer(() => {
  const { store } = useContext(Context);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [description, setDescription] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [roleType, setRoleType] = useState("actor");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [actors, setActors] = useState([]);
  const [actorsWithImages, setActorsWithImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActorId, setSelectedActorId] = useState(null);
  const [actionType, setActionType] = useState('');
  const [theatres, setTheatres] = useState([]);
  const [loadingTheatres, setLoadingTheatres] = useState(true);
  const [roleTypeFilter, setRoleTypeFilter] = useState('actor');
  const [managerTheatre, setManagerTheatre] = useState(null);
  const [loadingManagerTheatre, setLoadingManagerTheatre] = useState(true);

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
    }
  };

  // Загрузка театра менеджера
  useEffect(() => {
    const loadManagerTheatre = async () => {
      try {
        setLoadingManagerTheatre(true);
        const theatreData = await store.getTheatreByManager(store.user.id);
        setManagerTheatre(theatreData);
        setTheatreId(theatreData?.ID || "");
        setLoadingManagerTheatre(false);
      } catch (err) {
        console.error('Ошибка загрузки театра менеджера:', err);
        setLoadingManagerTheatre(false);
      }
    };

    if (store.user.id) {
      loadManagerTheatre();
    }
  }, [store]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем все театры (для информации)
        const theatresData = await store.getTheatres();
        setTheatres(theatresData);
        setLoadingTheatres(false);

        // Загружаем всех актёров
        const data = await store.getCast();
        
        // Фильтруем актёров по театру менеджера, если театр загружен
        let filteredActors = data;
        if (managerTheatre) {
          filteredActors = data.filter(actor => 
            actor.Theatre_id === managerTheatre.ID
          );
        }
        
        setActors(filteredActors);
        
        // Загружаем изображения для отфильтрованных актёров
        const actorsWithImagesPromises = filteredActors.map(async (actor) => {
          if (actor.Photo) {
            try {
              const filePath = actor.Photo.replace("https://webdav.yandex.ru", "");
              const url = await getYandexDiskFileUrl(filePath);
              return { ...actor, imageUrl: url };
            } catch (error) {
              console.error("Error loading image for actor:", actor.Name, error);
              return { ...actor, imageUrl: "" };
            }
          }
          return { ...actor, imageUrl: "" };
        });

        const actorsWithImages = await Promise.all(actorsWithImagesPromises);
        setActorsWithImages(actorsWithImages);
      } catch (err) {
        setError("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };
    
    if (managerTheatre || loadingManagerTheatre === false) {
      fetchData();
    }
  }, [store, managerTheatre]);

  // Фильтруем актёров по выбранному типу роли
  const filteredActors = actorsWithImages.filter(actor => 
    actor.RoleType === roleTypeFilter
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!managerTheatre) {
      setError("Не удалось определить ваш театр. Обратитесь к администратору.");
      return;
    }
    
    if (!name || !surname || !file) {
      setError("Все обязательные поля должны быть заполнены");
      return;
    }
    
    try {
      setActionType('add');
      // Используем theatreId из managerTheatre
      await store.addCast(name, surname, file, description, managerTheatre.ID, roleType);
      setSuccess(true);
      setName("");
      setSurname("");
      setDescription("");
      setFile(null);
      setPreviewUrl(null);
      
      // Обновляем список актёров
      const updatedActors = await store.getCast();
      
      // Снова фильтруем по театру менеджера
      const filteredUpdatedActors = updatedActors.filter(actor => 
        actor.Theatre_id === managerTheatre.ID
      );
      
      setActors(filteredUpdatedActors);
      
      // Обновляем изображения
      const updatedActorsWithImages = await Promise.all(
        filteredUpdatedActors.map(async (actor) => {
          if (actor.Photo) {
            try {
              const filePath = actor.Photo.replace("https://webdav.yandex.ru", "");
              const url = await getYandexDiskFileUrl(filePath);
              return { ...actor, imageUrl: url };
            } catch (error) {
              console.error("Error loading image for actor:", actor.Name, error);
              return { ...actor, imageUrl: "" };
            }
          }
          return { ...actor, imageUrl: "" };
        })
      );
      setActorsWithImages(updatedActorsWithImages);
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка добавления сотрудника");
    }
  };

  const handleDelete = async () => {
    if (!selectedActorId) {
      setError("Выберите сотрудника для удаления");
      return;
    }

    const selectedActor = actors.find(a => a.Cast_id === selectedActorId);
    if (selectedActor && window.confirm(`Вы уверены, что хотите удалить сотрудника ${selectedActor.Name} ${selectedActor.Surname}?`)) {
      try {
        setActionType('delete');
        await store.deleteCast(selectedActorId);
        
        const updatedActors = actors.filter(actor => actor.Cast_id !== selectedActorId);
        setActors(updatedActors);
        
        const updatedActorsWithImages = actorsWithImages.filter(actor => actor.Cast_id !== selectedActorId);
        setActorsWithImages(updatedActorsWithImages);
        
        setSelectedActorId(null);
        setSuccess(true);
        setError("");
      } catch (err) {
        setError("Ошибка при удалении сотрудника");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const getRoleTypeText = (role) => {
    switch(role) {
      case 'actor': return 'Актёр';
      case 'director': return 'Художественный руководитель';
      case 'playwright': return 'Режиссёр';
      default: return role;
    }
  };

  return (
    <>
    <ManagerHeader/>
    <Paper elevation={3} sx={{ 
      p: 4,
      backgroundColor: '#2a2a2a',
      borderRadius: 2,
      maxWidth: '100%',
      mx: 'auto',
      mt: 4
    }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Avatar sx={{ 
          bgcolor: '#d32f2f',
          width: 56,
          height: 56,
          mr: 2
        }}>
          <PersonAdd fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            Управление персоналом
          </Typography>
          {managerTheatre && (
            <Box display="flex" alignItems="center" mt={1}>
              <Business sx={{ color: '#d32f2f', mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
                Ваш театр: <span style={{ color: 'white', fontWeight: 500 }}>{managerTheatre.ThName}</span>
              </Typography>
              <Chip 
                label={managerTheatre.ThCity}
                size="small"
                sx={{ 
                  ml: 2,
                  backgroundColor: 'rgba(211, 47, 47, 0.2)',
                  color: 'white'
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ bgcolor: '#444', mb: 4 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 4 }}>
        <Paper elevation={2} sx={{ 
          p: 3,
          backgroundColor: '#333',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
            Добавить нового сотрудника
          </Typography>

          {loadingManagerTheatre ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress sx={{ color: '#d32f2f' }} />
            </Box>
          ) : managerTheatre ? (
            <>
              <Box sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderRadius: 1,
                border: '1px solid rgba(211, 47, 47, 0.3)'
              }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  Театр:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                  {managerTheatre.ThName} ({managerTheatre.ThCity})
                </Typography>
                <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 1 }}>
                  Сотрудник будет добавлен в этот театр автоматически
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField 
                  label="Имя" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  sx={inputStyles}
                />
                <TextField 
                  label="Фамилия" 
                  value={surname} 
                  onChange={(e) => setSurname(e.target.value)} 
                  required
                  sx={inputStyles}
                />
                
                <FormControl sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: '#aaa', mb: 1 }}>
                    Тип роли:
                  </Typography>
                  <RadioGroup
                    row
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                  >
                    <FormControlLabel 
                      value="actor" 
                      control={<Radio sx={{ color: '#d32f2f' }} />} 
                      label="Актёр" 
                      sx={{ color: 'white' }}
                    />
                    <FormControlLabel 
                      value="director" 
                      control={<Radio sx={{ color: '#d32f2f' }} />} 
                      label="Художественный руководитель" 
                      sx={{ color: 'white' }}
                    />
                    <FormControlLabel 
                      value="playwright" 
                      control={<Radio sx={{ color: '#d32f2f' }} />} 
                      label="Режиссёр" 
                      sx={{ color: 'white' }}
                    />
                  </RadioGroup>
                </FormControl>
                
                <TextField 
                  label="Описание" 
                  multiline 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  sx={inputStyles}
                  placeholder="Опыт работы, достижения, особенности творческого стиля..."
                />

                <Button 
                  variant="contained" 
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{
                    backgroundColor: '#424242',
                    '&:hover': { backgroundColor: '#616161' },
                    py: 1.5
                  }}
                >
                  Загрузить фото
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} required />
                </Button>

                {previewUrl && (
                  <Box sx={{ 
                    border: '1px solid #444',
                    borderRadius: 1,
                    overflow: 'hidden',
                    maxWidth: 300
                  }}>
                    <img 
                      src={previewUrl} 
                      alt="Предпросмотр" 
                      style={{ 
                        width: '100%',
                        display: 'block'
                      }} 
                    />
                  </Box>
                )}

                <Button 
                  type="submit" 
                  variant="contained"
                  sx={{
                    mt: 2,
                    py: 1.5,
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' }
                  }}
                >
                  Добавить {getRoleTypeText(roleType).toLowerCase()}
                </Button>

                <Button 
                  variant="contained"
                  onClick={handleDelete}
                  disabled={!selectedActorId}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    backgroundColor: '#424242',
                    '&:hover': { backgroundColor: '#616161' },
                    '&:disabled': { opacity: 0.7 }
                  }}
                >
                  Удалить выбранного
                </Button>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Не удалось загрузить информацию о вашем театре. Обратитесь к администратору.
            </Alert>
          )}
        </Paper>

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Сотрудники театра
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FilterList sx={{ color: '#aaa' }} />
              <Select
                value={roleTypeFilter}
                onChange={(e) => setRoleTypeFilter(e.target.value)}
                size="small"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f'
                  },
                  minWidth: 150
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2a2a2a',
                      color: 'white'
                    }
                  }
                }}
              >
                <MenuItem value="actor">Актёры</MenuItem>
                <MenuItem value="director">Художественные руководители</MenuItem>
                <MenuItem value="playwright">Режиссёры</MenuItem>
                <MenuItem value="all">Все</MenuItem>
              </Select>
            </Box>
          </Box>

          {loadingManagerTheatre ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress sx={{ color: '#d32f2f' }} />
            </Box>
          ) : managerTheatre ? (
            loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress sx={{ color: '#d32f2f' }} />
              </Box>
            ) : filteredActors.length > 0 ? (
              <>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                  Показано: {filteredActors.length} сотрудников
                </Typography>
                <TableContainer component={Paper} sx={{ 
                  backgroundColor: '#333',
                  maxHeight: '600px',
                  overflow: 'auto'
                }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#2a2a2a' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Фото</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Имя</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Фамилия</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Должность</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Описание</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredActors.map((actor) => (
                        <TableRow 
                          key={actor.Cast_id} 
                          hover 
                          onClick={() => setSelectedActorId(actor.Cast_id)}
                          sx={{ 
                            '&:hover': { backgroundColor: '#3a3a3a' },
                            color: 'white',
                            backgroundColor: selectedActorId === actor.Cast_id ? '#3a3a3a' : 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          <TableCell>
                            {actor.Photo ? (
                              <Avatar 
                                src={actor.imageUrl} 
                                sx={{ width: 56, height: 56 }}
                              />
                            ) : (
                              <Avatar sx={{ width: 56, height: 56, bgcolor: '#424242' }}>
                                {actor.Name[0]}
                              </Avatar>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>{actor.Name}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{actor.Surname}</TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            <Chip 
                              label={getRoleTypeText(actor.RoleType)}
                              size="small"
                              sx={{ 
                                backgroundColor: actor.RoleType === 'actor' ? 'rgba(66, 165, 245, 0.2)' : 
                                              actor.RoleType === 'director' ? 'rgba(76, 175, 80, 0.2)' : 
                                              'rgba(255, 152, 0, 0.2)',
                                color: actor.RoleType === 'actor' ? '#42a5f5' : 
                                       actor.RoleType === 'director' ? '#4CAF50' : 
                                       '#ff9800',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'white', maxWidth: 300 }}>
                            <Typography 
                              variant="body2"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {actor.Description || 'Описание отсутствует'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {roleTypeFilter === 'all' 
                  ? 'В вашем театре пока нет сотрудников' 
                  : `В вашем театре пока нет ${getRoleTypeText(roleTypeFilter).toLowerCase()}ов`}
              </Alert>
            )
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Не удалось загрузить сотрудников. Информация о театре не найдена.
            </Alert>
          )}
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => {
          setSuccess(false);
          setActionType(''); 
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => {
            setSuccess(false);
            setActionType('');
          }} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {actionType === 'add' ? "Сотрудник успешно добавлен!" : "Сотрудник успешно удален!"}
        </Alert>
      </Snackbar>
    </Paper>
    </>
  );
});

export default AddCast;