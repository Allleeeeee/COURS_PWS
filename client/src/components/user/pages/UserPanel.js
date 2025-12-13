import React, { useEffect, useState, useContext } from "react";
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
  Chip
} from "@mui/material";
import { 
  Search, 
  TheaterComedy,
  LocationOn,
  MyLocation,
  CalendarToday
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import SeanceCard from "../components/SeanceCard";
import "./page-styles/UserPanel.css";
import Header from "../components/Header";
import { DateRange } from "@mui/icons-material";

const UserPanel = observer(() => {
  const { store } = useContext(Context);
  const [seances, setSeances] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [offset, setOffset] = useState(0);
  const [visibleSeances, setVisibleSeances] = useState(10);

  // Все возможные жанры (можно расширить)
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
    const fetchSeances = async () => {
      try {
        const response = await store.getSeancesWithDetails();
        const seancesData = response.data || [];
        setSeances(seancesData);
        
        // Извлекаем уникальные города из сеансов
        const cities = [...new Set(seancesData
          .map(seance => seance.show?.theatre?.city)
          .filter(city => city && city !== "Неизвестно")
        )].sort();
        
        setAvailableCities(cities);
        
        // Автоматически выбираем первый город если не выбран
        if (cities.length > 0 && !selectedCity) {
          setSelectedCity(cities[0]);
        }
        
      } catch (err) {
        console.error(err);
        setError("Ошибка при загрузке сеансов.");
      }
    };

    fetchSeances();
  }, [store]);

  // Функция для определения местоположения пользователя
  const detectUserCity = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Здесь можно добавить логику для определения города по координатам
          // Пока просто покажем сообщение
          alert("Определение города по местоположению... В демо-версии выберите город вручную.");
        },
        (error) => {
          console.error("Ошибка геолокации:", error);
          alert("Не удалось определить местоположение. Выберите город вручную.");
        }
      );
    } else {
      alert("Геолокация не поддерживается вашим браузером.");
    }
  };

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
      // Фильтр по городу
      const matchesCity = 
        !selectedCity || 
        seance.show?.theatre?.city === selectedCity;

      // Фильтр по поисковому запросу
      const matchesSearch = 
        !searchTerm || 
        seance.show?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seance.show?.theatre?.name?.toLowerCase().includes(searchTerm.toLowerCase());

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

      return matchesCity && matchesSearch && matchesGenres && matchesDateRange();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); // Сортировка по дате

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCity("");
    setSelectedGenres([]);
    setDateRange({ start: "", end: "" });
  };

  const loadMoreSeances = () => {
    setVisibleSeances(prev => prev + 10);
  };

  // Подсчитываем активные фильтры
  const activeFiltersCount = [
    searchTerm,
    selectedCity,
    selectedGenres.length > 0,
    dateRange.start || dateRange.end
  ].filter(Boolean).length;

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
        <Typography 
          className="exclude-font"
          variant="h3" 
          component="h1" 
          sx={{ 
            color: '#A9A9A9', 
            zIndex: 2,
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
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-15px',
              left: '10%',
              width: '80%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #d32f2f, transparent)',
              borderRadius: '50%'
            }
          }}
        >
          Get closer to art
        </Typography>
      </div>

      <Container maxWidth={false} className="main-container">
        {/* Панель выбора города */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={selectedCity === "" ? "contained" : "outlined"}
                  onClick={() => setSelectedCity("")}
                  startIcon={<LocationOn />}
                  sx={{
                    fontFamily: "'Cormorant', serif",
                    fontSize: "1.1rem",
                    color: selectedCity === "" ? 'white' : '#d32f2f',
                    borderColor: '#d32f2f',
                    backgroundColor: selectedCity === "" ? '#d32f2f' : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedCity === "" ? '#b71c1c' : 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  Все города
                </Button>
                
                {availableCities.map(city => (
                  <Button
                    key={city}
                    variant={selectedCity === city ? "contained" : "outlined"}
                    onClick={() => setSelectedCity(city)}
                    sx={{
                      fontFamily: "'Cormorant', serif",
                      fontSize: "1.1rem",
                      color: selectedCity === city ? 'white' : '#d32f2f',
                      borderColor: '#d32f2f',
                      backgroundColor: selectedCity === city ? '#d32f2f' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedCity === city ? '#b71c1c' : 'rgba(211, 47, 47, 0.1)'
                      }
                    }}
                  >
                    {city}
                  </Button>
                ))}
              </Box>
            </Grid>
  
          </Grid>
        </Box>

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
                placeholder="Название или театр..."
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
                        sx={{
                          color: '#d32f2f',
                          '&.Mui-checked': {
                            color: '#d32f2f',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ 
                        color: '#fff',
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
              
              {selectedCity && (
                <Chip
                  label={`Город: ${selectedCity}`}
                  onDelete={() => setSelectedCity("")}
                  sx={{
                    color: '#fff',
                    backgroundColor: '#d32f2f',
                    fontFamily: "'Cormorant', serif",
                    '& .MuiChip-deleteIcon': {
                      color: '#fff',
                      '&:hover': {
                        color: '#ffcdd2'
                      }
                    }
                  }}
                />
              )}
              
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
            </Box>

            {/* Сетка сеансов */}
            <div className="seance-grid">
              {filteredSeances
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
                    : "Нет доступных сеансов"}
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
});

export default UserPanel;