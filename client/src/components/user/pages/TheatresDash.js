import React, { useEffect, useState, useContext } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Grid,
  Avatar,
  Badge,
  Rating
} from '@mui/material';
import { 
  TheaterComedy, 
  LocationOn, 
  LocalPhone, 
  Search,
  Clear,
  Place,
  Language,
  Schedule,
  Star,
  StarBorder,
  Directions,
  Email,
  Info
} from '@mui/icons-material';
import { Context } from '../../..';
import { useNavigate } from 'react-router-dom';
import "./page-styles/TheatreDash.css";
import Header from '../components/Header';

const TheatersDash = () => {
  const { store } = useContext(Context);
  const [theaters, setTheaters] = useState([]);
  const [filteredTheaters, setFilteredTheaters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        setLoading(true);
        const response = await store.getTheatres();
        const theatersData = response || [];
        setTheaters(theatersData);
        setFilteredTheaters(theatersData);
        
        // Извлекаем уникальные города
        const uniqueCities = [...new Set(theatersData
          .map(theater => theater.ThCity)
          .filter(city => city && city.trim() !== '')
        )].sort();
        
        setCities(['Все города', ...uniqueCities]);
      } catch (error) {
        console.error('Ошибка при загрузке театров:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTheaters();
  }, [store]);

  useEffect(() => {
    let filtered = theaters;
    
    // Фильтрация по городу
    if (selectedCity !== 'Все города') {
      filtered = filtered.filter(theater => theater.ThCity === selectedCity);
    }
    
    // Фильтрация по поиску
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(theater => 
        theater.ThName.toLowerCase().includes(searchLower) ||
        theater.ThAddress.toLowerCase().includes(searchLower) ||
        (theater.ThDescription && theater.ThDescription.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredTheaters(filtered);
  }, [searchTerm, selectedCity, theaters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
  };

  const getTheaterRating = (theater) => {
    // Здесь можно добавить реальный рейтинг из базы данных
    // Пока возвращаем фиктивный рейтинг на основе ID для демонстрации
    const rating = 3.5 + (theater.ID % 5) / 2;
    return Math.min(5, Math.max(1, rating));
  };

  const getTheaterShowsCount = (theater) => {
    // Здесь можно добавить реальное количество спектаклей
    // Пока возвращаем фиктивное число
    return 5 + (theater.ID % 10);
  };

  return (
    <div className='theatres-container'>
      <Header/>
      
      {/* Параллакс-секция с заголовком */}
      <Box
        sx={{
          position: 'relative',
          height: '350px',
          background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1579092529237-3d28d1e8c8a5?auto=format&fit=crop&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 6
        }}
      >
        <Box sx={{ textAlign: 'center', zIndex: 1 }}>
          <TheaterComedy sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
          <Typography variant="h2" sx={{ 
            color: 'white', 
            fontWeight: 700,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 1
          }}>
            Наши театры
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#ddd', 
            maxWidth: '800px',
            mx: 'auto',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            Откройте для себя мир театрального искусства. Выберите театр, чтобы узнать больше о постановках, актерах и репертуаре.
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        {/* Панель фильтров */}
        <Box sx={{ 
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          p: 4,
          mb: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <Grid container spacing={3}>
            {/* Поиск */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Найти театр
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Название, адрес или описание..."
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    '& fieldset': {
                      borderColor: '#444',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d32f2f',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d32f2f',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#d32f2f' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={clearSearch} 
                        edge="end"
                        sx={{ color: '#d32f2f' }}
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Фильтр по городу */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Город
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                maxHeight: '120px',
                overflowY: 'auto',
                p: 1
              }}>
                {cities.map((city) => (
                  <Chip
                    key={city}
                    label={city}
                    onClick={() => handleCityChange(city)}
                    sx={{
                      backgroundColor: selectedCity === city ? '#d32f2f' : '#444',
                      color: 'white',
                      fontWeight: selectedCity === city ? 600 : 400,
                      '&:hover': {
                        backgroundColor: selectedCity === city ? '#b71c1c' : '#555',
                      }
                    }}
                    icon={city === 'Все города' ? <Place /> : <LocationOn />}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Индикаторы фильтров */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Найдено театров: <strong>{filteredTheaters.length}</strong>
            </Typography>
            
            {(selectedCity !== 'Все города' || searchTerm) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedCity('Все города');
                  setSearchTerm('');
                }}
                sx={{
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    borderColor: '#b71c1c'
                  }
                }}
              >
                Сбросить фильтры
              </Button>
            )}
            
            {selectedCity !== 'Все города' && (
              <Chip
                label={`Город: ${selectedCity}`}
                onDelete={() => setSelectedCity('Все города')}
                sx={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  '& .MuiChip-deleteIcon': {
                    color: 'white',
                    '&:hover': {
                      color: '#ffcdd2'
                    }
                  }
                }}
              />
            )}
            
            {searchTerm && (
              <Chip
                label={`Поиск: ${searchTerm}`}
                onDelete={clearSearch}
                sx={{
                  backgroundColor: '#333',
                  color: 'white',
                  '& .MuiChip-deleteIcon': {
                    color: '#d32f2f',
                    '&:hover': {
                      color: '#b71c1c'
                    }
                  }
                }}
              />
            )}
          </Box>
        </Box>

        {/* Список театров */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Box sx={{ textAlign: 'center' }}>
              <TheaterComedy sx={{ fontSize: 60, color: '#d32f2f', mb: 2, animation: 'pulse 2s infinite' }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Загрузка театров...
              </Typography>
            </Box>
          </Box>
        ) : filteredTheaters.length > 0 ? (
          <Grid container spacing={3}>
            {filteredTheaters.map((theater) => (
              <Grid item xs={12} key={theater.ID}>
                <Card 
                  sx={{ 
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    border: '1px solid #333',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    }
                  }}
                  onClick={() => navigate(`/OurTheatres/${theater.ID}`)}
                >
                  <CardContent sx={{ cursor: 'pointer', p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Левый блок: Основная информация */}
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: '#d32f2f',
                              width: 60,
                              height: 60,
                              mr: 2,
                              fontSize: '1.5rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {theater.ThName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ color: 'white', mb: 0.5 }}>
                              {theater.ThName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn sx={{ fontSize: 16, color: '#d32f2f' }} />
                              <Typography variant="h6" sx={{ color: '#aaa' }}>
                                {theater.ThCity}
                              </Typography>
                              <Box component="span" sx={{ color: '#666', mx: 1 }}>•</Box>
                              <Typography variant="h6" sx={{ color: '#888' }}>
                                {theater.ThAddress}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>


                        {/* Описание */}
                        {theater.ThDescription && (
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: '#ccc',
                              mb: 2,
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {theater.ThDescription}
                          </Typography>
                        )}

                        {/* Контакты */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {theater.ThPhone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalPhone sx={{ fontSize: 18, color: '#d32f2f' }} />
                              <Typography variant="h6" sx={{ color: '#aaa' }}>
                                {theater.ThPhone}
                              </Typography>
                            </Box>
                          )}
                          
                          {theater.ThEmail && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Email sx={{ fontSize: 18, color: '#d32f2f' }} />
                              <Typography variant="h6" sx={{ color: '#aaa' }}>
                                {theater.ThEmail}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Правый блок: Кнопка и доп. информация */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', md: 'flex-end' }
                        }}>
                          <Button
                            variant="contained"
                            endIcon={<Directions />}
                            sx={{
                              bgcolor: '#d32f2f',
                              color: 'white',
                              px: 4,
                              py: 1.5,
                              borderRadius: '8px',
                              '&:hover': {
                                bgcolor: '#b71c1c',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            Подробнее
                          </Button>
                          
                          <Box sx={{ mt: 3, textAlign: { xs: 'left', md: 'right' } }}>
                            {theater.WorkingHours && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Schedule sx={{ fontSize: 16, color: '#d32f2f' }} />
                                <Typography variant="body1" sx={{ color: '#888' }}>
                                  {theater.WorkingHours}
                                </Typography>
                              </Box>
                            )}
                            
                            <Typography variant="body2" sx={{ 
                              color: '#666',
                              fontStyle: 'italic',
                              display: 'block'
                            }}>
                              Нажмите для подробной информации
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: '#2a2a2a',
            borderRadius: '12px'
          }}>
            <Info sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              {searchTerm || selectedCity !== 'Все города' ? 'Ничего не найдено' : 'Театры не найдены'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
              {searchTerm || selectedCity !== 'Все города' 
                ? 'Попробуйте изменить параметры поиска или выберите другой город'
                : 'В данный момент нет доступных театров'}
            </Typography>
            {(searchTerm || selectedCity !== 'Все города') && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedCity('Все города');
                  setSearchTerm('');
                }}
                sx={{
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    borderColor: '#b71c1c'
                  }
                }}
              >
                Показать все театры
              </Button>
            )}
          </Box>
        )}
      </Container>
    </div>
  );
};

export default TheatersDash;