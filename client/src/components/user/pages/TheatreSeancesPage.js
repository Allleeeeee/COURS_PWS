import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Container, 
  Typography, 
  TextField,
  InputAdornment,
  Box,
  Grid,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  Avatar
} from "@mui/material";
import { 
  Search, 
  ArrowBack,
  TheaterComedy,
  LocationOn,
  CalendarToday,
  Star,
  Phone,
  Email,
  Schedule,
  Info
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import SeanceCard from "../components/SeanceCard";
import Header from "../components/Header";
import "./page-styles/UserPanel.css";

const TheatreSeancesPage = observer(() => {
  const { id } = useParams();
  const { store } = useContext(Context);
  const [seances, setSeances] = useState([]);
  const [theater, setTheater] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [offset, setOffset] = useState(0);
  const [visibleSeances, setVisibleSeances] = useState(10);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Все возможные жанры
  const allGenres = ["Драма", "Комедия", "Мюзикл", "Фантастика", "Военное", "Романтика", "Исторический"];

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const theaterResponse = await store.getTheatreById(id);
        setTheater(theaterResponse);
        
        const seancesResponse = await store.getSeancesByTheatre(id);
        const seancesData = seancesResponse.data || [];
        setSeances(seancesData);
        
      } catch (err) {
        console.error(err);
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, store]);

  const handleGenreChange = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredSeances = seances
    .filter(seance => {
      // Фильтр по поисковому запросу
      const matchesSearch = 
        !searchTerm || 
        seance.show?.title?.toLowerCase().includes(searchTerm.toLowerCase());

      // Фильтр по жанрам
      const matchesGenres = 
        selectedGenres.length === 0 || 
        selectedGenres.includes(seance.show?.genre);

      // Фильтр по диапазону дат
      const matchesDateRange = () => {
        if (!dateRange.start && !dateRange.end) return true;
        
        const seanceDate = new Date(seance.startTime);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
          return seanceDate >= startDate && seanceDate <= endDate;
        } else if (startDate) {
          return seanceDate >= startDate;
        } else if (endDate) {
          return seanceDate <= endDate;
        }
        return true;
      };

      return matchesSearch && matchesGenres && matchesDateRange();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenres([]);
    setDateRange({ start: "", end: "" });
  };

  const loadMoreSeances = () => {
    setVisibleSeances(prev => prev + 10);
  };

  // Подсчитываем активные фильтры
  const activeFiltersCount = [
    searchTerm,
    selectedGenres.length > 0,
    dateRange.start || dateRange.end
  ].filter(Boolean).length;

  // Функция для получения уникальных жанров в этом театре
  const getTheatreGenres = () => {
    const genres = new Set();
    seances.forEach(seance => {
      if (seance.show?.genre) {
        genres.add(seance.show.genre);
      }
    });
    return Array.from(genres);
  };

  const theatreGenres = getTheatreGenres();

  return (
    <div className="user-panel">
      <Header/>
      
      <div 
        className="parallax-section"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/Frame82.png)`,
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          height: '450px',
          position: 'relative',
          transform: `translateY(${offset * 0.5}px)`,
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }}
        />
        <Box sx={{ 
          zIndex: 2, 
          textAlign: 'center',
          maxWidth: '800px',
          px: 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 3,
            mb: 2
          }}>
         
            <Box>
              <Typography 
                className="exclude-font"
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: '#A9A9A9', 
                  fontFamily: '"UnifrakturMaguntia", cursive',
                  fontWeight: 400, 
                  textShadow: `
                    1px 1px 0px #d32f2f,
                    3px 3px 0px rgba(0, 0, 0, 0.8),
                    5px 5px 10px rgba(0, 0, 0, 0.5)
                  `,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  letterSpacing: '3px',
                  textTransform: 'none', 
                }}
              >
                {theater ? theater.name : 'Загрузка...'}
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#ddd',
                  fontFamily: '"Cormorant", serif',
                  fontWeight: 400,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 1
                }}
              >
                <LocationOn sx={{ fontSize: 20 }} />
                {theater?.city}, {theater?.address}
              </Typography>
            </Box>
          </Box>
        </Box>
      </div>

      <Container maxWidth={false} className="main-container">
        {/* Кнопка назад */}
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 4, 
            color: '#d32f2f',
            fontFamily: "'Cormorant', serif",
            fontSize: "1.3rem",
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            }
          }}
        >
          Назад к списку театров
        </Button>

        {/* Информация о театре */}
        {theater && (
          <Box sx={{ 
            mb: 4, 
            p: 4, 
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <Grid container spacing={4} alignItems="center">
              {/* Информация о театре */}
              <Grid item xs={12} md={8}>
                <Typography variant="h5" sx={{ 
                  color: 'white', 
                  mb: 3,
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <TheaterComedy sx={{ color: '#d32f2f' }} />
                  Информация о театре
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {theater.description && (
                    <Typography variant="body1" sx={{ color: '#ccc', lineHeight: 1.6 }}>
                      {theater.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                    {theater.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ color: '#d32f2f' }} />
                        <Typography variant="body1" sx={{ color: '#aaa' }}>
                          {theater.phone}
                        </Typography>
                      </Box>
                    )}
                    
                    {theater.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ color: '#d32f2f' }} />
                        <Typography variant="body1" sx={{ color: '#aaa' }}>
                          {theater.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {theater.workingHours && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ color: '#d32f2f' }} />
                        <Typography variant="body1" sx={{ color: '#aaa' }}>
                          {theater.workingHours}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {theatreGenres.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: '#ddd', mb: 1 }}>
                        Представленные жанры в этом театре:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {theatreGenres.map((genre, index) => (
                          <Chip
                            key={index}
                            label={genre}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(211, 47, 47, 0.2)',
                              color: 'white',
                              fontFamily: "'Cormorant', serif",
                              '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 0.3)'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* Статистика */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid #444'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: 'white', 
                    mb: 3,
                    fontFamily: "'Cormorant', serif",
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    Статистика
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px'
                    }}>
                      <Typography variant="body1" sx={{ color: '#aaa' }}>
                        Всего сеансов
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                        {seances.length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px'
                    }}>
                      <Typography variant="body1" sx={{ color: '#aaa' }}>
                        Предстоящие
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                        {seances.filter(s => s.status === 'Не проведён').length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px'
                    }}>
                      <Typography variant="body1" sx={{ color: '#aaa' }}>
                        Жанров
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#2196F3', fontWeight: 600 }}>
                        {theatreGenres.length}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Левая панель с фильтрами */}
          <Grid item xs={12} md={3}>
            <Box sx={{ 
              p: 3, 
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333',
              position: 'sticky',
              top: '20px'
            }}>
              {/* Индикатор активных фильтров */}
              {activeFiltersCount > 0 && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    sx={{ 
                      color: '#fff',
                      fontFamily: "'Cormorant', serif",
                      fontSize: "1.2rem",
                      fontWeight: 600
                    }}
                  >
                    Активные фильтры: {activeFiltersCount}
                  </Typography>
                  <Button 
                    size="small"
                    onClick={clearFilters}
                    sx={{
                      color: '#d32f2f',
                      fontFamily: "'Cormorant', serif",
                      fontSize: "0.9rem"
                    }}
                  >
                    Сбросить все
                  </Button>
                </Box>
              )}

              {/* Поиск */}
              <Typography 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Cormorant', serif",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Поиск
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Название спектакля..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#d32f2f' }} />
                    </InputAdornment>
                  ),
                  sx: { 
                    color: 'white',
                    fontFamily: "'Cormorant', serif",
                    fontSize: "1.1rem",
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d32f2f'
                    }
                  }
                }}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ borderColor: '#333', mb: 3 }} />

              {/* Жанры */}
              <Typography 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Cormorant', serif",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Жанры
              </Typography>
              
              <FormGroup>
                {allGenres.map(genre => (
                  <FormControlLabel
                    key={genre}
                    control={
                      <Checkbox
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        disabled={!theatreGenres.includes(genre)}
                        sx={{
                          color: '#d32f2f',
                          '&.Mui-checked': {
                            color: '#d32f2f',
                          },
                          '&.Mui-disabled': {
                            color: '#666',
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ 
                        color: theatreGenres.includes(genre) ? '#fff' : '#666',
                        fontFamily: "'Cormorant', serif",
                        fontSize: "1.1rem"
                      }}>
                        {genre}
                      </Typography>
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>

              <Divider sx={{ borderColor: '#333', my: 3 }} />

              {/* Диапазон дат */}
              <Typography 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Cormorant', serif",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Дата
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  type="date"
                  label="С"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    sx: { 
                      color: '#aaa',
                      fontFamily: "'Cormorant', serif",
                      '&.Mui-focused': {
                        color: '#d32f2f'
                      }
                    }
                  }}
                  InputProps={{
                    sx: { 
                      color: 'white',
                      fontFamily: "'Cormorant', serif",
                      fontSize: "1.1rem",
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#555'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#d32f2f'
                      }
                    }
                  }}
                />
                
                <TextField
                  type="date"
                  label="По"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    sx: { 
                      color: '#aaa',
                      fontFamily: "'Cormorant', serif",
                      '&.Mui-focused': {
                        color: '#d32f2f'
                      }
                    }
                  }}
                  InputProps={{
                    sx: { 
                      color: 'white',
                      fontFamily: "'Cormorant', serif",
                      fontSize: "1.1rem",
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#555'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#d32f2f'
                      }
                    }
                  }}
                />
              </Box>

              <Divider sx={{ borderColor: '#333', my: 3 }} />

              {/* Быстрые даты */}
              <Typography 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Cormorant', serif",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Быстрые даты
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="text"
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    
                    setDateRange({
                      start: today.toISOString().split('T')[0],
                      end: nextWeek.toISOString().split('T')[0]
                    });
                  }}
                  sx={{
                    color: '#d32f2f',
                    fontFamily: "'Cormorant', serif",
                    fontSize: "1rem",
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  Ближайшие 7 дней
                </Button>
                
                <Button
                  variant="text"
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(today.getMonth() + 1);
                    
                    setDateRange({
                      start: today.toISOString().split('T')[0],
                      end: nextMonth.toISOString().split('T')[0]
                    });
                  }}
                  sx={{
                    color: '#d32f2f',
                    fontFamily: "'Cormorant', serif",
                    fontSize: "1rem",
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  Ближайший месяц
                </Button>
                
                <Button
                  variant="text"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      start: today.toISOString().split('T')[0],
                      end: ""
                    });
                  }}
                  sx={{
                    color: '#d32f2f',
                    fontFamily: "'Cormorant', serif",
                    fontSize: "1rem",
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  Сегодня и позже
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Основной контент */}
          <Grid item xs={12} md={9}>
            {/* Панель с информацией о фильтрах */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Cormorant', serif",
                  fontSize: "1.1rem",
                  mr: 2
                }}
              >
                Найдено сеансов: {filteredSeances.filter(s => s.status === 'Не проведён').length}
              </Typography>
              
              {selectedGenres.map(genre => (
                <Chip
                  key={genre}
                  label={genre}
                  onDelete={() => handleGenreChange(genre)}
                  sx={{
                    color: '#fff',
                    backgroundColor: '#333',
                    fontFamily: "'Cormorant', serif",
                    '& .MuiChip-deleteIcon': {
                      color: '#d32f2f',
                      '&:hover': {
                        color: '#b71c1c'
                      }
                    }
                  }}
                />
              ))}
              
              {(dateRange.start || dateRange.end) && (
                <Chip
                  label={`Дата: ${dateRange.start || '∞'} - ${dateRange.end || '∞'}`}
                  onDelete={() => setDateRange({ start: "", end: "" })}
                  sx={{
                    color: '#fff',
                    backgroundColor: '#333',
                    fontFamily: "'Cormorant', serif",
                    '& .MuiChip-deleteIcon': {
                      color: '#d32f2f',
                      '&:hover': {
                        color: '#b71c1c'
                      }
                    }
                  }}
                />
              )}
              
              {searchTerm && (
                <Chip
                  label={`Поиск: ${searchTerm}`}
                  onDelete={() => setSearchTerm('')}
                  sx={{
                    color: '#fff',
                    backgroundColor: '#333',
                    fontFamily: "'Cormorant', serif",
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

            {/* Сетка сеансов */}
            <div className="seance-grid">
              {loading ? (
                <Box sx={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  py: 8
                }}>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Загрузка сеансов...
                  </Typography>
                </Box>
              ) : filteredSeances
                .filter(seance => seance.status === 'Не проведён')
                .slice(0, visibleSeances)
                .length > 0 ? (
                <>
                  {filteredSeances
                    .filter(seance => seance.status === 'Не проведён')
                    .slice(0, visibleSeances)
                    .map((seance) => (
                      <div className="seance-grid-item" key={seance.id}>
                        <SeanceCard seance={seance} />
                      </div>
                    ))}
                  
                  {filteredSeances.filter(seance => seance.status === 'Не проведён').length > visibleSeances && (
                    <Box sx={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 4,
                      gridColumn: '1 / -1'
                    }}>
                      <Button 
                        variant="outlined"
                        onClick={loadMoreSeances}
                        sx={{
                          color: '#d32f2f',
                          borderColor: '#d32f2f',
                          padding: '12px 24px',
                          fontSize: '1rem',
                          fontFamily: "'Cormorant', serif",
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            borderColor: '#b71c1c'
                          }
                        }}
                      >
                        Показать еще
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mt: 4, 
                    color: "white",
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    fontFamily: "'Cormorant', serif",
                  }}
                >
                  {searchTerm || selectedGenres.length > 0 || dateRange.start || dateRange.end 
                    ? "Ничего не найдено" 
                    : "В этом театре пока нет доступных сеансов"}
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
});

export default TheatreSeancesPage;