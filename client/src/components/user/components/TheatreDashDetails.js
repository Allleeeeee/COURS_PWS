import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Collapse
} from '@mui/material';
import { 
  TheaterComedy, 
  LocationOn, 
  Info, 
  ArrowBack, 
  Phone, 
  Email, 
  AccessTime,
  ExpandMore,
  ExpandLess,
  Person,
  Movie,
  Theaters,
  Groups
} from '@mui/icons-material';
import { Context } from '../../..';
import Header from './Header';
import YandexMap from './YandexMap';
import { getYandexDiskFileUrl } from '../../manager/yandex/disk';

const TheatreDashDetail = () => {
  const { id } = useParams();
  const { store } = useContext(Context);
  const [theater, setTheater] = useState(null);
  const [processedTheater, setProcessedTheater] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Функция для преобразования ссылок на фотографии
  const processCastPhoto = async (photoUrl) => {
    if (!photoUrl) return null;
    try {
      if (photoUrl.startsWith('https://webdav.yandex.ru')) {
        const filePath = photoUrl.replace("https://webdav.yandex.ru", "");
        const processedUrl = await getYandexDiskFileUrl(filePath);
        return processedUrl;
      }
      return photoUrl;
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      return photoUrl; // Возвращаем оригинальную ссылку в случае ошибки
    }
  };

  // Функция для обработки всей труппы
  const processAllCastPhotos = async (theaterData) => {
    if (!theaterData || !theaterData.casts) return theaterData;
    
    setLoadingPhotos(true);
    
    try {
      // Создаем копию данных театра
      const processedData = { ...theaterData };
      
      // Обрабатываем актеров
      if (processedData.casts.actors && processedData.casts.actors.length > 0) {
        const processedActors = await Promise.all(
          processedData.casts.actors.map(async (actor) => {
            const photoUrl = await processCastPhoto(actor.photo);
            return { ...actor, photo: photoUrl };
          })
        );
        processedData.casts.actors = processedActors;
      }
      
      // Обрабатываем режиссеров
      if (processedData.casts.playwrights && processedData.casts.playwrights.length > 0) {
        const processedPlaywrights = await Promise.all(
          processedData.casts.playwrights.map(async (playwright) => {
            const photoUrl = await processCastPhoto(playwright.photo);
            return { ...playwright, photo: photoUrl };
          })
        );
        processedData.casts.playwrights = processedPlaywrights;
      }
      
      // Обрабатываем художественных руководителей
      if (processedData.casts.directors && processedData.casts.directors.length > 0) {
        const processedDirectors = await Promise.all(
          processedData.casts.directors.map(async (director) => {
            const photoUrl = await processCastPhoto(director.photo);
            return { ...director, photo: photoUrl };
          })
        );
        processedData.casts.directors = processedDirectors;
      }
      
      return processedData;
    } catch (error) {
      console.error('Ошибка обработки фотографий:', error);
      return theaterData;
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    const fetchTheater = async () => {
      try {
        const response = await store.getTheatreById(id);
        console.log("ТЕАТР" + JSON.stringify(response));
        
        // Сначала устанавливаем исходные данные
        setTheater(response);
        
        // Затем обрабатываем фотографии
        const processedResponse = await processAllCastPhotos(response);
        setProcessedTheater(processedResponse);
      } catch (error) {
        console.error('Ошибка при загрузке театра:', error);
      }
    };
    fetchTheater();
  }, [id, store]);

  // Используем processedTheater если он есть, иначе theater
  const displayTheater = processedTheater || theater;

  if (!displayTheater) return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      <Typography variant="h4" sx={{ 
        color: '#d32f2f',
        fontFamily: "'Cormorant', serif",
        fontWeight: 500
      }}>
        Загрузка театра...
      </Typography>
    </Box>
  );

  const hasCoordinates = displayTheater.latitude && displayTheater.longitude;
  const hasCast = displayTheater.stats.totalCasts > 0;

  const formatWorkingHours = (hours) => {
    if (!hours) return 'Информация о расписании отсутствует';
    return hours.split('\n').map((line, index) => (
      <Typography key={index} variant="body2" sx={{ mb: 0.5, color: '#e0e0e0' }}>
        {line}
      </Typography>
    ));
  };

  return (
    <>
      <Header />
      
      {/* Герой-секция с названием театра */}
      <Box sx={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        py: 6,
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid #d32f2f'
      }}>
        <Container maxWidth="lg">
          <Button 
            startIcon={<ArrowBack sx={{ color: '#d32f2f' }} />}
            onClick={() => navigate(-1)}
            sx={{ 
              mb: 3, 
              color: '#d32f2f',
              fontFamily: "'Cormorant', serif",
              fontSize: '1.1rem',
              fontWeight: 500,
              letterSpacing: '1px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)'
              }
            }}
          >
            Назад
          </Button>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3
          }}>
            <TheaterComedy sx={{ 
              fontSize: 70, 
              color: '#d32f2f',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 600,
                  fontSize: { xs: '2.2rem', md: '3rem' },
                  letterSpacing: '1px',
                  lineHeight: 1.2
                }}
              >
                {displayTheater.name}
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#aaa',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 400,
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <LocationOn sx={{ fontSize: '1.2rem', color: '#d32f2f' }} />
                {displayTheater.city}, {displayTheater.address}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {/* Основная информация карточка */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            backgroundColor: '#2a2a2a',
            borderRadius: 0,
            border: '1px solid #444',
            mb: 4
          }}
        >
          <Grid container spacing={4}>
            {/* Контактная информация */}
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#d32f2f',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 600,
                  mb: 3,
                  borderBottom: '2px solid #d32f2f',
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Info sx={{ fontSize: '1.5rem' }} />
                Контакты
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone sx={{ color: '#d32f2f' }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#e0e0e0',
                      fontFamily: "'Cormorant', serif",
                      fontWeight: 400,
                      fontSize: '1.1rem'
                    }}
                  >
                    {displayTheater.phone}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email sx={{ color: '#d32f2f' }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#e0e0e0',
                      fontFamily: "'Cormorant', serif",
                      fontWeight: 400,
                      fontSize: '1.1rem'
                    }}
                  >
                    {displayTheater.email}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <AccessTime sx={{ color: '#d32f2f', mt: 0.5 }} />
                  <Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#e0e0e0',
                        fontFamily: "'Cormorant', serif",
                        fontWeight: 400,
                        mb: 1,
                        fontSize: '1.1rem'
                      }}
                    >
                      Часы работы:
                    </Typography>
                    <Button
                      endIcon={expandedSchedule ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setExpandedSchedule(!expandedSchedule)}
                      sx={{ 
                        color: '#d32f2f',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 'auto',
                        fontFamily: "'Cormorant', serif",
                        fontSize: '1rem'
                      }}
                    >
                      {expandedSchedule ? 'Скрыть' : 'Показать расписание'}
                    </Button>
                    <Collapse in={expandedSchedule}>
                      <Box sx={{ mt: 1 }}>
                        {formatWorkingHours(displayTheater.workingHours)}
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Карта */}
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#d32f2f',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 600,
                  mb: 3,
                  borderBottom: '2px solid #d32f2f',
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <LocationOn sx={{ fontSize: '1.5rem' }} />
                Расположение
              </Typography>
              
              {hasCoordinates ? (
                <Box sx={{ 
                  border: '2px solid #444',
                  overflow: 'hidden'
                }}>
                  <YandexMap 
                    coordinates={[displayTheater.latitude, displayTheater.longitude]}
                    address={displayTheater.address}
                    width="100%" 
                    height="250px"
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  height: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #444'
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#888',
                      fontFamily: "'Cormorant', serif",
                      fontStyle: 'italic'
                    }}
                  >
                    Карта недоступна
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* О театре */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            backgroundColor: '#2a2a2a',
            borderRadius: 0,
            border: '1px solid #444',
            mb: 4
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#d32f2f',
              fontFamily: "'Cormorant', serif",
              fontWeight: 600,
              mb: 3,
              borderBottom: '2px solid #d32f2f',
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TheaterComedy sx={{ fontSize: '1.5rem' }} />
            О театре
          </Typography>
          
          {displayTheater.description ? (
            <>
              <Collapse in={expandedDescription} collapsedSize={100}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#e0e0e0',
                    fontFamily: "'Cormorant', serif",
                    lineHeight: 1.8,
                    textAlign: 'justify',
                    fontSize: '1.1rem'
                  }}
                >
                  {displayTheater.description}
                </Typography>
              </Collapse>
              <Button
                endIcon={expandedDescription ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setExpandedDescription(!expandedDescription)}
                sx={{ 
                  mt: 2,
                  color: '#d32f2f',
                  textTransform: 'none',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              >
                {expandedDescription ? 'Скрыть' : 'Читать полностью'}
              </Button>
            </>
          ) : (
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#888',
                fontFamily: "'Cormorant', serif",
                fontStyle: 'italic',
                fontSize: '1.1rem'
              }}
            >
              Описание театра отсутствует
            </Typography>
          )}
        </Paper>

        {/* Труппа театра */}
        {hasCast && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 4,
              backgroundColor: '#2a2a2a',
              borderRadius: 0,
              border: '1px solid #444',
              mb: 4
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#d32f2f',
                fontFamily: "'Cormorant', serif",
                fontWeight: 600,
                mb: 3,
                borderBottom: '2px solid #d32f2f',
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Groups sx={{ fontSize: '1.5rem' }} />
              Труппа театра
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Person />} 
                label={`Актёры: ${displayTheater.stats.totalActors}`} 
                sx={{ 
                  backgroundColor: 'rgba(211, 47, 47, 0.2)',
                  color: '#d32f2f',
                  fontWeight: 500,
                  fontFamily: "'Cormorant', serif",
                  fontSize: '1rem',
                  border: '1px solid rgba(211, 47, 47, 0.5)'
                }}
              />
              <Chip 
                icon={<Movie />} 
                label={`Режиссёры: ${displayTheater.stats.totalPlaywrights}`} 
                sx={{ 
                  backgroundColor: 'rgba(211, 47, 47, 0.2)',
                  color: '#d32f2f',
                  fontWeight: 500,
                  fontFamily: "'Cormorant', serif",
                  fontSize: '1rem',
                  border: '1px solid rgba(211, 47, 47, 0.5)'
                }}
              />
              <Chip 
                icon={<Theaters />} 
                label={`Худ. рук.: ${displayTheater.stats.totalDirectors}`} 
                sx={{ 
                  backgroundColor: 'rgba(211, 47, 47, 0.2)',
                  color: '#d32f2f',
                  fontWeight: 500,
                  fontFamily: "'Cormorant', serif",
                  fontSize: '1rem',
                  border: '1px solid rgba(211, 47, 47, 0.5)'
                }}
              />
            </Box>

            {loadingPhotos && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
                  Загрузка фотографий...
                </Typography>
              </Box>
            )}

            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: '#444',
                mb: 3
              }}
              TabIndicatorProps={{
                style: { backgroundColor: '#d32f2f' }
              }}
            >
              <Tab 
                label={`Актёры (${displayTheater.stats.totalActors})`}
                sx={{ 
                  color: activeTab === 0 ? '#d32f2f' : '#aaa',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              />
              <Tab 
                label={`Режиссёры (${displayTheater.stats.totalPlaywrights})`}
                sx={{ 
                  color: activeTab === 1 ? '#d32f2f' : '#aaa',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              />
              <Tab 
                label={`Худ. руководство (${displayTheater.stats.totalDirectors})`}
                sx={{ 
                  color: activeTab === 2 ? '#d32f2f' : '#aaa',
                  fontFamily: "'Cormorant', serif",
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              />
            </Tabs>

            <List>
              {activeTab === 0 && displayTheater.casts.actors.map((actor) => (
                <ListItem 
                  key={actor.id}
                  sx={{
                    mb: 2,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 0,
                    border: '1px solid #444',
                    '&:hover': {
                      backgroundColor: '#222'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={actor.photo}
                      sx={{ 
                        width: 60, 
                        height: 60,
                        border: '2px solid #d32f2f'
                      }}
                    >
                      {actor.name.charAt(0)}{actor.surname.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#e0e0e0',
                          fontFamily: "'Cormorant', serif",
                          fontWeight: 600,
                          fontSize: '1.2rem'
                        }}
                      >
                        {actor.fullName}
                      </Typography>
                    }
                    secondary={
                      actor.description ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#aaa',
                            fontFamily: "'Cormorant', serif",
                            mt: 0.5,
                            fontSize: '1rem'
                          }}
                        >
                          {actor.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
              
              {activeTab === 1 && displayTheater.casts.playwrights.map((playwright) => (
                <ListItem 
                  key={playwright.id}
                  sx={{
                    mb: 2,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 0,
                    border: '1px solid #444',
                    '&:hover': {
                      backgroundColor: '#222'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={playwright.photo}
                      sx={{ 
                        width: 60, 
                        height: 60,
                        border: '2px solid #d32f2f'
                      }}
                    >
                      {playwright.name.charAt(0)}{playwright.surname.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#e0e0e0',
                          fontFamily: "'Cormorant', serif",
                          fontWeight: 600,
                          fontSize: '1.2rem'
                        }}
                      >
                        {playwright.fullName}
                      </Typography>
                    }
                    secondary={
                      playwright.description ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#aaa',
                            fontFamily: "'Cormorant', serif",
                            mt: 0.5,
                            fontSize: '1rem'
                          }}
                        >
                          {playwright.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
              
              {activeTab === 2 && displayTheater.casts.directors.map((director) => (
                <ListItem 
                  key={director.id}
                  sx={{
                    mb: 2,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 0,
                    border: '1px solid #444',
                    '&:hover': {
                      backgroundColor: '#222'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={director.photo}
                      sx={{ 
                        width: 60, 
                        height: 60,
                        border: '2px solid #d32f2f'
                      }}
                    >
                      {director.name.charAt(0)}{director.surname.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#e0e0e0',
                          fontFamily: "'Cormorant', serif",
                          fontWeight: 600,
                          fontSize: '1.2rem'
                        }}
                      >
                        {director.fullName}
                      </Typography>
                    }
                    secondary={
                      director.description ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#aaa',
                            fontFamily: "'Cormorant', serif",
                            mt: 0.5,
                            fontSize: '1rem'
                          }}
                        >
                          {director.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
              
              {(!hasCast || 
                (activeTab === 0 && displayTheater.casts.actors.length === 0) ||
                (activeTab === 1 && displayTheater.casts.playwrights.length === 0) ||
                (activeTab === 2 && displayTheater.casts.directors.length === 0)) && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#888',
                    fontFamily: "'Cormorant', serif",
                    fontStyle: 'italic',
                    textAlign: 'center',
                    py: 4,
                    fontSize: '1.1rem'
                  }}
                >
                  Информация отсутствует
                </Typography>
              )}
            </List>
          </Paper>
        )}

        {/* Кнопка действий */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button 
            variant="contained"
            size="large"
            sx={{ 
              backgroundColor: '#d32f2f',
              color: 'white',
              fontFamily: "'Cormorant', serif",
              fontSize: '1.2rem',
              padding: '12px 30px',
              borderRadius: 0,
              fontWeight: 500,
              textTransform: 'none',
              letterSpacing: '1px',
              border: '2px solid #d32f2f',
              '&:hover': { 
                backgroundColor: '#b71c1c',
                border: '2px solid #b71c1c'
              },
              transition: 'all 0.3s ease'
            }}
            onClick={() => navigate(`/OurTheatres/${displayTheater.id}/seances`)}
          >
            Посмотреть афишу театра
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default TheatreDashDetail;