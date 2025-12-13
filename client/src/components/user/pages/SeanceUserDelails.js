import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Divider, 
  Container, 
  CircularProgress, 
  Grid,
  Avatar,
  Rating,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent
} from "@mui/material";
import { 
  CalendarDays, 
  MapPin, 
  ArrowLeft, 
  Ticket, 
  Info, 
  Users, 
  Star,
  Clock,
  User,
  BookOpen,
  Mic,
  PenTool as PenToolIcon,
  MessageCircle,
  MessageSquare
} from "lucide-react";
import "./page-styles/SeanceUserDetails.css";
import { Context } from "../../..";
import { getYandexDiskFileUrl } from "../../manager/yandex/disk";
import Header from "../components/Header";

const SeanceUserDetails = () => {
  const { id } = useParams(); 
  const [seance, setSeance] = useState(null);
  const { store } = useContext(Context);
  const [imageUrl, setImageUrl] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [openAgeDialog, setOpenAgeDialog] = useState(false);
  
  // Новые состояния для комментариев
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleOpenAgeDialog = () => setOpenAgeDialog(true);
  const handleCloseAgeDialog = () => setOpenAgeDialog(false);

  const fetchImage = async () => {
    setIsImageLoading(true);
    if (seance?.show.poster) {
      try {
        const filePath = seance.show.poster.replace("https://webdav.yandex.ru", "");
        const url = await getYandexDiskFileUrl(filePath);
        setImageUrl(url);
      } catch (error) {
        console.error("Ошибка загрузки изображения:", error);
        setImageUrl('/placeholder-poster.jpg');
      } finally {
        setIsImageLoading(false);
      }
    } else {
      setImageUrl('/placeholder-poster.jpg');
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allSeances = await store.getSeancesWithDetails();
        const found = allSeances.data.find(s => s.id.toString() === id);
        setSeance(found);
      } catch (error) {
        console.error("Ошибка при загрузке сеанса:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, store]);

  useEffect(() => {
    if (seance) {
      fetchImage();
      
      const fetchPrices = async () => {
        try {
          if (seance.show.start_price) {
            const [max, min] = await Promise.all([
              store.getMaxPrice(id),
              store.getMinPrice(id)
            ]);
            
            setMaxPrice(Number(max) + Number(seance.show.start_price));
            setMinPrice(Number(min) + Number(seance.show.start_price));
          }
        } catch (error) {
          console.error("Ошибка при загрузке цен:", error);
        }
      };
      fetchPrices();
    }
  }, [seance, id, store]);

  // Загрузка комментариев
  const loadComments = async () => {
    if (!seance || !seance.show || !seance.show.id) {
      console.error("Не удалось загрузить ID шоу");
      return;
    }
    
    try {
      setLoadingComments(true);
      console.log("Загружаем комментарии для showId:", seance.show.id);
      const response = await store.getShowComments(seance.show.id);
      console.log("Ответ от сервера:", response);
      
      // УБЕДИТЕСЬ, ЧТО БЕРЕМ response.data, а не response
      if (response && response.data) {
        console.log("Комментарии для отображения:", response.data);
        setComments(response.data); // <-- ВАЖНО: response.data, а не response
      } else if (Array.isArray(response)) {
        // Если ответ уже массив
        console.log("Ответ уже массив:", response);
        setComments(response);
      } else {
        console.warn("Некорректный формат ответа:", response);
        setComments([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Открыть/закрыть секцию комментариев
  const toggleComments = async () => {
    if (!showComments) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "Не указана";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}мин` : `${mins}мин`;
  };

  // Рекурсивное отображение комментариев с ответами
  const renderComments = (commentsList, depth = 0) => {
    if (!Array.isArray(commentsList) || commentsList.length === 0) {
      return null;
    }
    
    return commentsList.map((comment) => (
      <Box 
        key={comment.ID || comment.id} 
        sx={{ 
          ml: depth * 4, 
          mb: 2,
          p: 2,
          backgroundColor: depth > 0 ? 'rgba(42, 42, 42, 0.5)' : 'rgba(42, 42, 42, 0.7)',
          borderRadius: '8px',
          borderLeft: depth > 0 ? '2px solid #d32f2f' : 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#d32f2f' }}>
            {comment.User?.Name?.[0] || 
             comment.user?.name?.[0] || 
             comment.User?.name?.[0] || 
             'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                {comment.User?.Name} {comment.User?.Surname}
             
              </Typography>
              <Typography sx={{ color: '#aaa', fontSize: '0.9rem' }}>
                {formatDate(comment.CreatedAt || comment.createdAt || comment.created_at)}
              </Typography>
            </Box>
            
            {(comment.Rating || comment.rating) && (
              <Box sx={{ display: '-flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
                  Оценка:
                </Typography>
                <Rating 
                  value={comment.Rating || comment.rating} 
                  readOnly 
                  size="small"
                  sx={{ color: '#d32f2f' }}
                  max={10}
                />
                <Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
                  {(comment.Rating || comment.rating)}/10
                </Typography>
              </Box>
            )}
            
            <Typography sx={{ color: '#ddd', mb: 2, whiteSpace: 'pre-wrap' }}>
              {comment.Content || comment.content}
            </Typography>
            
            {/* Ответы на комментарий */}
            {(comment.Replies || comment.replies) && 
             (comment.Replies?.length > 0 || comment.replies?.length > 0) && (
              <Box sx={{ mt: 2 }}>
                {renderComments(comment.Replies || comment.replies, depth + 1)}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    ));
  };

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#121212'
      }}>
        <CircularProgress sx={{ color: '#d32f2f' }} />
      </Box>
    );
  }

  if (!seance) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#121212',
        color: 'white'
      }}>
        Не удалось загрузить данные о сеансе
      </Box>
    );
  }

  const { show, startTime, endTime } = seance;
  const startDate = new Date(startTime).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const startTimeOnly = new Date(startTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const endTimeOnly = new Date(endTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const priceRange = `${minPrice} – ${maxPrice} BYN`;
  
  const renderRatingStars = (rating) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Box sx={{ display: 'flex' }}>
          {[...Array(fullStars)].map((_, i) => (
            <Star key={`full-${i}`} fill="#d32f2f" color="#d32f2f" size={20} />
          ))}
          {hasHalfStar && (
            <Star key="half" fill="#d32f2f" color="#d32f2f" size={20} opacity={0.5} />
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <Star key={`empty-${i}`} color="#616161" size={20} />
          ))}
        </Box>
        <Typography variant="h5" sx={{ ml: 1, color: 'white' }}>
          {rating}/10
        </Typography>
      </Box>
    );
  };

  return (
    <div className="allseances">
      <Header/>
      <Container className="main-seance-container">
        <Box className="seance-details-container">
          {/* Кнопка назад */}
          <Button 
            startIcon={<ArrowLeft />}
            onClick={() => navigate(-1)}
            sx={{ 
              mb: 3, 
              color: '#d32f2f',
              fontSize:'1rem',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)'
              }
            }}
          >
            Назад
          </Button>

          {/* Основная информация */}
          <Box className="seance-main">
            <Box className="poster-container">
              {isImageLoading && (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a'
                  }}
                >
                  <Box 
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      border: '3px solid rgba(211, 47, 47, 0.2)',
                      borderTopColor: '#d32f2f',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                </Box>
              )}
              <img 
                className="seance-poster" 
                src={imageUrl} 
                alt={show.title} 
                onLoad={() => setIsImageLoading(false)}
                onError={(e) => {
                  e.target.src = '/placeholder-poster.jpg';
                  setIsImageLoading(false);
                }}
                style={{ opacity: isImageLoading ? 0 : 1 }}
              />
              <Chip 
                label={show.genre} 
                sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  backgroundColor: '#d32f2f', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>

            <Box className="seance-info">
              <Typography variant="h3" className="seance-title" sx={{color:"white"}}>
                {show.title}
              </Typography>
            
              {renderRatingStars(show.rating)}
              
              <Box className="info-section">
                {show.duration_minutes && (
                  <Box className="info-row">
                    <Clock size={20} color="#d32f2f" />
                    <Typography>
                      <strong>Длительность:</strong> {formatDuration(show.duration_minutes)}
                    </Typography>
                  </Box>
                )}

                {show.parts_count && (
                  <Box className="info-row">
                    <BookOpen size={20} color="#d32f2f" />
                    <Typography>
                      <strong>Количество частей:</strong> {show.parts_count}
                    </Typography>
                  </Box>
                )}

                {show.age_restriction && (
                  <Box className="info-row">
                    <User size={20} color="#d32f2f" />
                    <Typography>
                      <strong>Возрастное ограничение:</strong> {show.age_restriction}
                    </Typography>
                  </Box>
                )}

                <Box className="info-row">
                  <CalendarDays size={20} color="#d32f2f" />
                  <Typography>
                    <strong>{startDate}</strong> • {startTimeOnly}–{endTimeOnly}
                  </Typography>
                </Box>
                
                <Box className="info-row">
                  <MapPin size={20} color="#d32f2f" />
                  <Typography>
                    <strong>Место:</strong> {show.theatre.name}, {show.theatre.city}, {show.theatre.address}
                  </Typography>
                </Box>
                
                <Box className="info-row">
                  <Ticket size={20} color="#d32f2f" />
                  <Typography>
                    <strong>Цена:</strong> {priceRange}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    className="book-button"
                    startIcon={<Ticket size={20} />}
                    sx={{ 
                      backgroundColor: '#d32f2f', 
                      fontSize:'1.1rem',
                      py: 1.5
                    }}
                    onClick={() => {
                      if (show.age_restriction && show.age_restriction.includes('18+')) {
                        handleOpenAgeDialog();
                      } else {
                        navigate(`/getTicket/${id}`);
                      }
                    }}
                  >
                    Забронировать билет
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MessageCircle size={20} />}
                    onClick={toggleComments}
                    sx={{ 
                      color: '#d32f2f',
                      borderColor: '#d32f2f',
                      fontSize:'1.1rem',
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        borderColor: '#d32f2f'
                      }
                    }}
                  >
                    {showComments ? 'Скрыть отзывы' : 'Посмотреть отзывы'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Секция комментариев */}
          {showComments && (
            <Card sx={{ 
              mt: 4, 
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              border: '1px solid #444'
            }}>
              <CardContent>
                <Typography variant="h4" sx={{ 
                  color: 'white', 
                  mb: 3,
                  fontWeight: 600,
                  fontFamily: "'Cormorant', serif"
                }}>
                  <MessageCircle style={{ marginRight: 10, verticalAlign: 'middle' }} />
                  Отзывы зрителей
                </Typography>
                
                {/* Список комментариев */}
                <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                  Отзывы других зрителей ({Array.isArray(comments) ? comments.length : 0})
                </Typography>
                
                {loadingComments ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress sx={{ color: '#d32f2f' }} />
                  </Box>
                ) : Array.isArray(comments) && comments.length > 0 ? (
                  <Box>
                    {renderComments(comments)}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#aaa', textAlign: 'center', my: 4, fontStyle: 'italic' }}>
                    Пока нет отзывов. Будьте первым!
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          <Divider sx={{ my: 4, bgcolor: '#444' }} />

          {/* Описание и творческая группа */}
          <Box className="details-section">
            <Box className="description-block">
              <Typography variant="h4" className="section-title">
                <Info size={24} style={{ marginRight: 8 }} />
                Описание
              </Typography>
              <Typography className="description-text" sx={{fontSize:'1.3rem'}}>
                {show.description || 'Описание спектакля отсутствует'}
              </Typography>
            </Box>

            {/* Творческая группа */}
            <Box className="actors-block">
              <Typography variant="h4" className="section-title">
                <Users size={24} style={{ marginRight: 8 }} />
                Творческая группа
              </Typography>
              
              {show.cast?.actors && show.cast.actors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontFamily: "'Cormorant', serif" }}>
                    В ролях:
                  </Typography>
                  <Box className="actors-list">
                    {show.cast.actors.map((actor, index) => (
                      <Chip
                        key={index}
                        label={`${actor.name} ${actor.surname}${actor.role ? ` (${actor.role})` : ''}`}
                        sx={{ 
                          m: 0.5,
                          color: "white",
                          cursor: 'pointer',
                          fontSize:'1.1rem',
                          backgroundColor: 'rgba(211, 47, 47, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.3)'
                          }
                        }}
                        onClick={() => navigate(`/actor/${actor.id}`)}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {show.cast?.director && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontFamily: "'Cormorant', serif", display: 'flex', alignItems: 'center' }}>
                    <Mic size={18} style={{ marginRight: 8 }} />
                    Руководство:
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.2)'
                      }
                    }}
                    onClick={() => navigate(`/actor/${show.cast.director.id}`)}
                  >
                    <Typography sx={{ color: 'white', fontSize: '1.1rem', fontFamily: "'Cormorant', serif" }}>
                      <strong>{show.cast.director.name} {show.cast.director.surname}</strong>
                      {show.cast.director.role && ` (${show.cast.director.role})`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {show.cast?.playwright && (
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontFamily: "'Cormorant', serif", display: 'flex', alignItems: 'center' }}>
                    <PenToolIcon size={18} style={{ marginRight: 8 }} />
                    Драматург:
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.2)'
                      }
                    }}
                    onClick={() => navigate(`/actor/${show.cast.playwright.id}`)}
                  >
                    <Typography sx={{ color: 'white', fontSize: '1.1rem', fontFamily: "'Cormorant', serif" }}>
                      <strong>{show.cast.playwright.name} {show.cast.playwright.surname}</strong>
                      {show.cast.playwright.role && ` (${show.cast.playwright.role})`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {(!show.cast?.actors || show.cast.actors.length === 0) && !show.cast?.director && !show.cast?.playwright && (
                <Typography sx={{ color: 'white', fontFamily: "'Cormorant', serif" }}>
                  Информация о творческой группе отсутствует
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Диалог возрастного ограничения */}
        <Dialog
          open={openAgeDialog}
          onClose={handleCloseAgeDialog}
          aria-labelledby="age-restriction-dialog-title"
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #d32f2f',
              borderRadius: '8px'
            }
          }}
        >
          <DialogTitle id="age-restriction-dialog-title" sx={{ fontFamily: "'Cormorant', serif", color: '#d32f2f' }}>
            🔞 Подтверждение возраста
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#ddd', fontFamily: "'Cormorant', serif", fontSize: '1.1rem' }}>
              Этот спектакль имеет возрастное ограничение 18+.
              <br />
              <br />
              При входе в зал вам необходимо будет предъявить <strong>паспорт или иной документ, удостоверяющий личность и возраст</strong>.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={handleCloseAgeDialog} 
              sx={{ 
                color: '#aaa',
                fontFamily: "'Cormorant', serif",
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={() => {
                handleCloseAgeDialog();
                navigate(`/getTicket/${id}`);
              }} 
              variant="contained"
              sx={{ 
                backgroundColor: '#d32f2f',
                fontFamily: "'Cormorant', serif",
                '&:hover': {
                  backgroundColor: '#b71c1c'
                }
              }}
              autoFocus
            >
              Я подтверждаю, что мне 18+
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default SeanceUserDetails;