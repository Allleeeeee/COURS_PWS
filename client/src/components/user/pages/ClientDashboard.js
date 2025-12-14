import { Box, Typography, Button, Divider,Dialog, DialogTitle,DialogContent,DialogActions,Avatar, Paper, CircularProgress, Grid, TextField, Tabs, Tab, Rating, Chip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../..";
import { useNavigate } from "react-router-dom";
import { 
  Email,
  Person, 
  ExitToApp, 
  Home, 
  ConfirmationNumber, 
  TheaterComedy, 
  ArrowForward, 
  PersonAdd, 
  MovieFilter, 
  Directions,
  LocalActivity,
  Explore,
  Comment,
  AccessTime,
  Star,
  CalendarToday,
  LocationOn,
  Visibility,
  History
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import Header from "../components/Header";
import "./page-styles/ClientDashboard.css";
import TicketCard from "../components/TicketCard";
import SeanceCard from "../components/SeanceCard";

const ClientDashboard = observer(() => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState(0); // 0 - билеты, 1 - рекомендации, 2 - комментарии, 3 - история
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    newPassword: '',
    currentPassword: ''
  });
  const [errors, setErrors] = useState({});
  
  // Состояния для рекомендаций
  const [genreRecommendations, setGenreRecommendations] = useState([]);
  const [actorRecommendations, setActorRecommendations] = useState([]);
  const [playwrightRecommendations, setPlaywrightRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [userGenres, setUserGenres] = useState([]);
  const [userActors, setUserActors] = useState([]);
  const [userPlaywrights, setUserPlaywrights] = useState([]);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState(0);
  
  // Состояния для комментариев
  const [userComments, setUserComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsGroupedByShow, setCommentsGroupedByShow] = useState({});
  // Добавьте это в начало компонента с другими состояниями
const [cancelTicketId, setCancelTicketId] = useState(null);

// Добавьте функцию подтверждения отмены
const handleConfirmCancel = async () => {
  if (cancelTicketId) {
    try {
      await store.deleteTicket(cancelTicketId);
      setTickets(prev => prev.filter(ticket => ticket.id !== cancelTicketId));
      setCancelTicketId(null);
    } catch (err) {
      console.error('Cancel failed:', err);
      setCancelTicketId(null);
    }
  }
};

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await store.getUser(store.user.id);
        setUserData(data);
        setFormData({
          name: data.Name,
          surname: data.Surname,
          newPassword: '',
          currentPassword: ''
        });
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
      }
    };
    
    if (store.user.id) {
      fetchUserData();
    }
  }, [store]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await store.getTicketsByClientId(store.user.id);
        const ticketsWithRatings = await Promise.all(
          data.ticket.map(async ticket => {
            // Для всех билетов проверяем, есть ли оценка
            try {
              const hasRated = await store.checkUserRating(store.user.id, ticket.show.id);
              return { ...ticket, hasRated };
            } catch (e) {
              console.error('Ошибка проверки оценки:', e);
              return { ...ticket, hasRated: false };
            }
          })
        );
        setTickets(ticketsWithRatings);
        
        // Извлекаем жанры, актеров и режиссеров из билетов пользователя
        const genres = new Set();
        const actorsMap = new Map();
        const playwrightsMap = new Map();
        
        ticketsWithRatings.forEach(ticket => {
          if (ticket.show.genre) {
            genres.add(ticket.show.genre);
          }
          
          if (ticket.show.actors) {
            ticket.show.actors.forEach(person => {
              const personId = person.id || person.Cast_id;
              const personName = person.name || person.Name;
              const personSurname = person.surname || person.Surname;
              const roleType = person.roleType || person.RoleType;
              
              if (roleType === 'actor') {
                if (!actorsMap.has(personId)) {
                  actorsMap.set(personId, {
                    id: personId,
                    name: personName,
                    surname: personSurname,
                    fullName: `${personName} ${personSurname}`,
                    roleType: 'actor',
                    count: 0
                  });
                }
                actorsMap.get(personId).count++;
              }
              
              if (roleType === 'playwright') {
                if (!playwrightsMap.has(personId)) {
                  playwrightsMap.set(personId, {
                    id: personId,
                    name: personName,
                    surname: personSurname,
                    fullName: `${personName} ${personSurname}`,
                    roleType: 'playwright',
                    count: 0
                  });
                }
                playwrightsMap.get(personId).count++;
              }
            });
          }
        });
        
        setUserGenres(Array.from(genres));
        setUserActors(Array.from(actorsMap.values()).sort((a, b) => b.count - a.count));
        setUserPlaywrights(Array.from(playwrightsMap.values()).sort((a, b) => b.count - a.count));
        
      } catch (error) {
        console.error("Ошибка загрузки билетов:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (store.user.id) {
      fetchData();
    }
  }, [store]);

  // Функция для загрузки всех рекомендаций
  const loadAllRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      // Загружаем все рекомендации параллельно
      const [genreResponse, actorResponse, playwrightResponse] = await Promise.all([
        store.getPersonalRecommendations(store.user.id),
        store.getPersonalRecommendationsByActors(store.user.id),
        store.getPersonalRecommendationsByPlaywrights(store.user.id)
      ]);
      
      // Обрабатываем рекомендации по жанрам
      let genreSeances = [];
      if (Array.isArray(genreResponse)) {
        genreSeances = genreResponse;
      } else if (genreResponse && genreResponse.seance) {
        genreSeances = genreResponse.seance;
      } else if (genreResponse && genreResponse.seances) {
        genreSeances = genreResponse.seances;
      } else if (genreResponse && genreResponse.data) {
        genreSeances = genreResponse.data.seance || genreResponse.data.seances || [];
      }
      
      // Обрабатываем рекомендации по актерам
      let actorSeances = [];
      if (Array.isArray(actorResponse)) {
        actorSeances = actorResponse;
      } else if (actorResponse && actorResponse.recommendations) {
        actorSeances = actorResponse.recommendations;
      } else if (actorResponse && actorResponse.seance) {
        actorSeances = actorResponse.seance;
      } else if (actorResponse && actorResponse.data) {
        actorSeances = actorResponse.data.recommendations || actorResponse.data.seance || [];
      }
      
      // Обрабатываем рекомендации по режиссерам
      let playwrightSeances = [];
      if (Array.isArray(playwrightResponse)) {
        playwrightSeances = playwrightResponse;
      } else if (playwrightResponse && playwrightResponse.recommendations) {
        playwrightSeances = playwrightResponse.recommendations;
      } else if (playwrightResponse && playwrightResponse.seance) {
        playwrightSeances = playwrightResponse.seance;
      } else if (playwrightResponse && playwrightResponse.data) {
        playwrightSeances = playwrightResponse.data.recommendations || playwrightResponse.data.seance || [];
      }
      
      setGenreRecommendations(genreSeances);
      setActorRecommendations(actorSeances);
      setPlaywrightRecommendations(playwrightSeances);
      
    } catch (error) {
      console.error("Ошибка загрузки рекомендаций:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Функция для загрузки комментариев пользователя
  const loadUserComments = async () => {
    setLoadingComments(true);
    try {
      const commentsResponse = await store.getUserComments(store.user.id);
      console.log("Комментарии пользователя:", commentsResponse);
      
      // Обрабатываем разные форматы ответа
      let comments = [];
      if (Array.isArray(commentsResponse)) {
        comments = commentsResponse;
      } else if (commentsResponse && commentsResponse.allComments) {
        comments = commentsResponse.allComments;
      } else if (commentsResponse && commentsResponse.data) {
        comments = commentsResponse.data.allComments || commentsResponse.data;
      } else if (commentsResponse && commentsResponse.groupedByShow) {
        setCommentsGroupedByShow(commentsResponse.groupedByShow);
        comments = commentsResponse.groupedByShow.flatMap(group => group.comments);
      }
      
      setUserComments(comments);
      
      // Группируем комментарии по спектаклям
      const grouped = comments.reduce((acc, comment) => {
        const showId = comment.Show_id || comment.showId;
        const showData = comment.Show || comment.show;
        
        if (!acc[showId]) {
          acc[showId] = {
            show: {
              id: showData?.ID || showData?.id || showId,
              title: showData?.Title || 'Неизвестный спектакль',
              genre: showData?.Genre,
              poster: showData?.Poster
            },
            comments: []
          };
        }
        acc[showId].comments.push(comment);
        return acc;
      }, {});
      
      setCommentsGroupedByShow(grouped);
      
    } catch (error) {
      console.error("Ошибка загрузки комментариев пользователя:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Загрузка комментариев при переходе на вкладку
  useEffect(() => {
    if (activeMainTab === 2 && store.user.id) {
      loadUserComments();
    }
  }, [activeMainTab, store.user.id]);

  const handleDeleteTicket = async (id) => {
    try {
      await store.deleteTicket(id);
      setTickets(prev => prev.filter(ticket => ticket.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleTicketRated = async (ticketId) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, hasRated: true } : ticket
      )
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const nameSurnameRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;
    
    if (!formData.name.trim() || !formData.name.match(nameSurnameRegex)) {
      newErrors.name = 'Имя должно содержать только буквы';
    }
    
    if (!formData.surname.trim() || !formData.surname.match(nameSurnameRegex)) {
      newErrors.surname = 'Фамилия должна содержать только буквы';
    }
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Подтвердите текущий пароль';
      }
      if (formData.newPassword.length < 5) {
        newErrors.newPassword = 'Пароль должен быть больше 5 символов';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;

    try {
      if (formData.newPassword) {
        const isPasswordValid = await store.varifyPassword(store.user.id, formData.currentPassword);
        if (!isPasswordValid) {
          setErrors({ currentPassword: 'Неверный текущий пароль' });
          return;
        }
      }

      await store.updateUser(
        store.user.id,
        formData.newPassword || undefined,
        formData.name,
        formData.surname
      );

      const updatedData = await store.getUser(store.user.id);
      setUserData(updatedData);
      setEditMode(false);
      setFormData(prev => ({ 
        ...prev, 
        newPassword: '',
        currentPassword: '' 
      }));
    } catch (error) {
      console.error(error);
      if (error.response) {
        setErrors({ apiError: error.response.data.message });
      }
    }
  };

  // Переключение на вкладку рекомендаций и загрузка данных
  const handleShowRecommendations = () => {
    setActiveMainTab(1);
    loadAllRecommendations();
  };

  // Форматирование даты комментария
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

  // Форматирование даты сеанса
  const formatSeanceDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Форматирование времени сеанса
  const formatSeanceTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userData) return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#2a2a2a'
      }}
    >
      <CircularProgress 
        size={60}
        thickness={4}
        sx={{
          color: '#d32f2f',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round'
          }
        }}
      />
    </Box>
  );

  // Сортируем билеты: сначала активные, потом неактивные
  const sortedTickets = [...tickets].sort((a, b) => {
    const isAActive = a.status !== 'Отменён';
    const isBActive = b.status !== 'Отменён';
    
    if (isAActive && !isBActive) return -1;
    if (!isAActive && isBActive) return 1;
    
    return new Date(b.show.date) - new Date(a.show.date);
  });

  // ИЗМЕНЕНА ЛОГИКА: Прошедшие неоценённые билеты для отображения
  const unratedPastTickets = sortedTickets.filter(ticket => {
    const isPast = ticket.ticketInfo?.status === 'Не активно'; // Билет уже прошел
    const isRated = ticket.hasRated; // Проверяем, оценен ли
    return isPast && !isRated; // Только прошедшие и неоценённые
  });

  // Активные (будущие) билеты
  const upcomingTickets = sortedTickets.filter(ticket => {
    const isInactive = ticket.ticketInfo?.status === 'Не активно';
    const isPast = new Date(ticket.startTime) < new Date();
    return !isInactive && !isPast;
  });

  // Оцененные билеты для истории
  const ratedTickets = sortedTickets.filter(ticket => ticket.hasRated);

  const hasTickets = tickets.length > 0;
  const hasUnratedPastTickets = unratedPastTickets.length > 0;
  const hasRatedTickets = ratedTickets.length > 0;
  const hasUpcomingTickets = upcomingTickets.length > 0;
  const hasRecommendationData = userGenres.length > 0 || userActors.length > 0 || userPlaywrights.length > 0;
  const hasComments = userComments.length > 0;

  return (
    <Box className="main-user-container" sx={{ minHeight: '100vh' }}>
      <Header />
      
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        p: 4,
        maxWidth: '1800px',
        mx: 'auto'
      }}>
        {/* Боковая панель навигации */}
        <Box sx={{ 
          width: { xs: '100%', md: '380px' },
          flexShrink: 0
        }}>
          <Paper elevation={6} sx={{ 
            p: 3,
            backgroundColor: '#2a2a2a',
            borderRadius: 2,
            mb: 3
          }}>
            {/* Профиль пользователя */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, color: "white" }}>
              <Avatar sx={{ 
                width: 60, 
                height: 60,
                bgcolor: '#d32f2f',
                fontSize: '1.3rem'
              }}>
                {userData.Name.charAt(0)}{userData.Surname.charAt(0)}
              </Avatar>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {userData.Name} {userData.Surname}
                </Typography>
                <Typography variant="body2" color="#aaa">
                  {userData.Email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, bgcolor: '#444' }} />

            {/* Основная навигация */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant={activeMainTab === 0 ? "contained" : "outlined"}
                startIcon={<LocalActivity />}
                onClick={() => setActiveMainTab(0)}
                sx={{
                  bgcolor: activeMainTab === 0 ? '#d32f2f' : 'transparent',
                  color: activeMainTab === 0 ? 'white' : '#d32f2f',
                  borderColor: '#d32f2f',
                  py: 1.5,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: activeMainTab === 0 ? '#b71c1c' : 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                Мои билеты
              </Button>
              
              <Button
                fullWidth
                variant={activeMainTab === 1 ? "contained" : "outlined"}
                startIcon={<Explore />}
                onClick={handleShowRecommendations}
                disabled={!hasTickets}
                sx={{
                  bgcolor: activeMainTab === 1 ? '#d32f2f' : 'transparent',
                  color: activeMainTab === 1 ? 'white' : (hasTickets ? '#d32f2f' : '#666'),
                  borderColor: hasTickets ? '#d32f2f' : '#666',
                  py: 1.5,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: activeMainTab === 1 ? '#b71c1c' : (hasTickets ? 'rgba(211, 47, 47, 0.1)' : 'transparent')
                  }
                }}
              >
                Куда ещё сходить?
              </Button>

              <Button
                fullWidth
                variant={activeMainTab === 2 ? "contained" : "outlined"}
                startIcon={<Comment />}
                onClick={() => setActiveMainTab(2)}
                sx={{
                  bgcolor: activeMainTab === 2 ? '#d32f2f' : 'transparent',
                  color: activeMainTab === 2 ? 'white' : '#d32f2f',
                  borderColor: '#d32f2f',
                  py: 1.5,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: activeMainTab === 2 ? '#b71c1c' : 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                Мои комментарии
              </Button>

              {/* Новая кнопка "История" */}
              <Button
                fullWidth
                variant={activeMainTab === 3 ? "contained" : "outlined"}
                startIcon={<History />}
                onClick={() => setActiveMainTab(3)}
                sx={{
                  bgcolor: activeMainTab === 3 ? '#d32f2f' : 'transparent',
                  color: activeMainTab === 3 ? 'white' : '#d32f2f',
                  borderColor: '#d32f2f',
                  py: 1.5,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: activeMainTab === 3 ? '#b71c1c' : 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                История ({ratedTickets.length})
              </Button>
            </Box>

            <Divider sx={{ my: 2, bgcolor: '#444' }} />

            {/* Вспомогательная навигация */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="text"
                startIcon={<Home />}
                onClick={() => navigate("/")}
                sx={{
                  color: '#aaa',
                  py: 1.2,
                  justifyContent: 'flex-start',
                  '&:hover': { 
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.05)' 
                  }
                }}
              >
                На главную
              </Button>
              
              <Button
                fullWidth
                variant="text"
                startIcon={<Person />}
                onClick={() => setEditMode(!editMode)}
                sx={{
                  color: '#aaa',
                  py: 1.2,
                  justifyContent: 'flex-start',
                  '&:hover': { 
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.05)' 
                  }
                }}
              >
                {editMode ? 'Отменить редактирование' : 'Изменить данные'}
              </Button>

              <Button
                fullWidth
                variant="text"
                startIcon={<ExitToApp />}
                onClick={() => store.logout().then(() => navigate("/"))}
                sx={{
                  color: '#d32f2f',
                  py: 1.2,
                  justifyContent: 'flex-start',
                  '&:hover': { 
                    bgcolor: 'rgba(211, 47, 47, 0.1)' 
                  }
                }}
              >
                Выйти
              </Button>
            </Box>
          </Paper>

          {/* Форма редактирования профиля */}
          {editMode && (
            <Paper elevation={6} sx={{ 
              p: 3,
              backgroundColor: '#2a2a2a',
              borderRadius: 2,
              mb: 3
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Редактировать профиль
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Имя"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: 'white' } }}
                  size="small"
                />
                
                <TextField
                  fullWidth
                  label="Фамилия"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  error={!!errors.surname}
                  helperText={errors.surname}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: 'white' } }}
                  size="small"
                />
                
                <TextField
                  fullWidth
                  label="Новый пароль"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: 'white' } }}
                  size="small"
                  placeholder="Оставьте пустым, чтобы не менять"
                />
                
                {formData.newPassword && (
                  <TextField
                    fullWidth
                    label="Текущий пароль"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    InputProps={{ style: { color: 'white' } }}
                    size="small"
                  />
                )}
                
                <Button 
                  type="submit" 
                  variant="contained"
                  fullWidth
                  sx={{ 
                    bgcolor: '#d32f2f',
                    '&:hover': { bgcolor: '#b71c1c' },
                    py: 1
                  }}
                >
                  Сохранить
                </Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Основной контент */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Вкладка "Мои билеты" */}

{/* Вкладка "Мои билеты" */}
{/* Вкладка "Мои билеты" */}
{activeMainTab === 0 && (
  <>
    <Typography variant="h4" sx={{ 
      mb: 3,
      fontWeight: 700,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <ConfirmationNumber fontSize="large" sx={{color:'#d32f2f'}} />
      Мои билеты
    </Typography>

    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress color="secondary" />
      </Box>
    ) : !hasTickets ? (
      <Paper elevation={4} sx={{ 
        p: 4,
        backgroundColor: '#2a2a2a',
        textAlign: 'center',
        borderRadius: 2
      }}>
        <Typography variant="h5" sx={{ mb: 2, color:"white" }}>
          У вас пока нет билетов
        </Typography>
        <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
          Приобретите билеты на спектакли, чтобы они отображались здесь!
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{
            bgcolor: '#d32f2f',
            '&:hover': { bgcolor: '#b71c1c' }
          }}
        >
          Посмотреть афишу
        </Button>
      </Paper>
    ) : (
      <>
        {/* Будущие/активные билеты */}
        {hasUpcomingTickets && (
          <>
            <Typography variant="h5" sx={{ 
              color: 'white', 
              mb: 2,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AccessTime sx={{ color: '#b71c1c' }} />
              Предстоящие спектакли
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
              Активные билеты на будущие сеансы:
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {upcomingTickets.map(ticket => (
                <Grid item xs={12} key={ticket.id}>
                  <Paper elevation={4} sx={{ 
                    p: 3,
                    backgroundColor: '#1a1a1a',
                    borderRadius: 2,
                    borderLeft: '4px solid #b71c1c',
                    '&:hover': {
                      backgroundColor: '#222222'
                    }
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                          {ticket.show.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip 
                            label={ticket.show.genre} 
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(175, 84, 76, 0.2)',
                              color: '#b71c1c'
                            }} 
                          />
                          <Chip 
                            label={`${ticket.rowNumber} ряд, ${ticket.seatNumber} место`}
                            size="small"
                            sx={{ 
                              backgroundColor: '#424242',
                              color: '#aaa'
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: '#b71c1c' }} />
                            <Typography variant="body2" sx={{ color: '#b71c1c' }}>
                              {formatSeanceDate(ticket.startTime)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 16, color: '#b71c1c' }} />
                            <Typography variant="body2" sx={{ color: '#b71c1c' }}>
                              {formatSeanceTime(ticket.startTime)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                          <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                          {ticket.show.theatre.name}, {ticket.show.theatre.address}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4} sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        gap: 2
                      }}>
                     
                        
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setCancelTicketId(ticket.id)}
                          sx={{
                            borderColor: '#d32f2f',
                            color: '#d32f2f',
                            '&:hover': { 
                              borderColor: '#b71c1c',
                              backgroundColor: 'rgba(211, 47, 47, 0.1)'
                            },
                            py: 1.5
                          }}
                        >
                          Отменить бронь
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Прошедшие неоценённые билеты */}
        {hasUnratedPastTickets && (
          <>
            <Typography variant="h5" sx={{ 
              color: 'white', 
              mb: 2,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Star sx={{ color: '#d32f2f' }} />
              Оцените просмотренные спектакли
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
              Эти спектакли уже прошли - оставьте вашу оценку:
            </Typography>
            
            <Grid container spacing={3}>
              {unratedPastTickets.map(ticket => (
                <Grid item xs={12} key={ticket.id}>
                  <TicketCard 
                    ticket={ticket} 
                    onDelete={handleDeleteTicket}
                    onRated={() => handleTicketRated(ticket.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Если нет неоценённых билетов, но есть будущие */}
        {!hasUnratedPastTickets && hasUpcomingTickets && (
          <Paper elevation={4} sx={{ 
            p: 4,
            backgroundColor: '#2a2a2a',
            textAlign: 'center',
            borderRadius: 2,
            mt: 4
          }}>
            <Star sx={{ fontSize: 48, color: '#b71c1c', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, color:"white" }}>
              Все просмотренные спектакли оценены!
            </Typography>
            <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
              У вас есть {upcomingTickets.length} активных билетов на будущие спектакли.
              После их посещения вы сможете оставить оценку здесь.
            </Typography>
          </Paper>
        )}
      </>
    )}

    {/* Модальное окно подтверждения отмены */}
    <Dialog
      open={!!cancelTicketId}
      onClose={() => setCancelTicketId(null)}
      PaperProps={{
        sx: {
          backgroundColor: '#2a2a2a',
          color: 'white',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
        Подтверждение отмены
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: '#aaa', mb: 2 }}>
          Вы уверены, что хотите отменить бронирование этого билета?
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
          После отмены билет станет доступен для покупки другим пользователям.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={() => setCancelTicketId(null)}
          sx={{ 
            color: '#aaa',
            '&:hover': { 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.05)' 
            }
          }}
        >
          Нет, оставить
        </Button>
        <Button 
          onClick={handleConfirmCancel}
          variant="contained"
          sx={{ 
            bgcolor: '#d32f2f',
            '&:hover': { bgcolor: '#b71c1c' }
          }}
        >
          Да, отменить
        </Button>
      </DialogActions>
    </Dialog>
  </>
)}
          {/* Вкладка "Куда ещё сходить?" */}
          {activeMainTab === 1 && (
            <>
              <Typography variant="h4" sx={{ 
                mb: 3,
                fontWeight: 700,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Explore fontSize="large" sx={{color:'#d32f2f'}} />
                Куда ещё сходить?
              </Typography>

              {/* Статистика пользователя */}
              <Paper elevation={4} sx={{ 
                p: 4,
                backgroundColor: '#2a2a2a',
                borderRadius: 2,
                mb: 4
              }}>
                <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TheaterComedy /> Ваши театральные предпочтения
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {userGenres.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(211, 47, 47, 0.3)',
                        height: '100%'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: '#d32f2f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MovieFilter /> Любимые жанры
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {userGenres.map((genre, index) => (
                            <Box
                              key={index}
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'rgba(211, 47, 47, 0.2)',
                                borderRadius: 1
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'white' }}>{genre}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {userActors.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        height: '100%'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: '#4CAF50', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonAdd /> Знакомые актёры
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                          {userActors.length} актёров в {userActors.reduce((sum, actor) => sum + actor.count, 0)} постановках
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#bbb' }}>
                          {userActors.slice(0, 3).map(actor => actor.fullName).join(', ')}
                          {userActors.length > 3 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {userPlaywrights.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(66, 165, 245, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(66, 165, 245, 0.3)',
                        height: '100%'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: '#42a5f5', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Directions /> Знакомые режиссёры
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                          {userPlaywrights.length} режиссёров в {userPlaywrights.reduce((sum, playwright) => sum + playwright.count, 0)} постановках
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#bbb' }}>
                          {userPlaywrights.slice(0, 3).map(playwright => playwright.fullName).join(', ')}
                          {userPlaywrights.length > 3 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Рекомендации */}
              {loadingRecommendations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ color: '#d32f2f', mb: 2 }} size={40} />
                    <Typography variant="body1" sx={{ color: '#aaa' }}>
                      Ищем лучшие рекомендации для вас...
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Paper elevation={4} sx={{ 
                  p: 4,
                  backgroundColor: '#2a2a2a',
                  borderRadius: 2
                }}>
                  <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                    Рекомендуем посмотреть
                  </Typography>
                  
                  {/* Табы для фильтрации рекомендаций */}
                  <Tabs 
                    value={activeRecommendationTab} 
                    onChange={(e, newValue) => setActiveRecommendationTab(newValue)}
                    sx={{ 
                      borderBottom: 1, 
                      borderColor: '#444',
                      mb: 3,
                      '& .MuiTab-root': { 
                        minWidth: 'auto', 
                        px: 2, 
                        mx: 1,
                        fontSize: '0.9rem'
                      }
                    }}
                    TabIndicatorProps={{
                      style: { backgroundColor: '#d32f2f' }
                    }}
                  >
                    <Tab 
                      label={`По жанрам (${genreRecommendations.length})`}
                      sx={{ 
                        color: 'white',
                        '&.Mui-selected': { color: '#d32f2f' }
                      }}
                    />
                    <Tab 
                      label={`По актёрам (${actorRecommendations.length})`}
                      sx={{ 
                        color: 'white',
                        '&.Mui-selected': { color: '#d32f2f' }
                      }}
                    />
                    <Tab 
                      label={`По режиссёрам (${playwrightRecommendations.length})`}
                      sx={{ 
                        color: 'white',
                        '&.Mui-selected': { color: '#d32f2f' }
                      }}
                    />
                  </Tabs>
                  
                  {/* Сетка рекомендаций */}
                  <div className="seance-grid" style={{ marginTop: '20px' }}>
                    {activeRecommendationTab === 0 && (
                      genreRecommendations.length > 0 ? (
                        genreRecommendations.map((recommendation) => (
                          <div className="seance-grid-item" key={recommendation.seanceId || recommendation.id}>
                            <SeanceCard 
                              seance={{
                                id: recommendation.seanceId || recommendation.id,
                                startTime: recommendation.startTime,
                                endTime: recommendation.endTime,
                                status: recommendation.status,
                                show: {
                                  id: recommendation.show.id,
                                  title: recommendation.show.title,
                                  poster: recommendation.show.poster,
                                  genre: recommendation.show.genre,
                                  description: recommendation.show.description,
                                  start_price: recommendation.show.start_price,
                                  theatre: {
                                    id: recommendation.show.theatre.id,
                                    name: recommendation.show.theatre.name,
                                    address: recommendation.show.theatre.address
                                  }
                                }
                              }} 
                            />
                          </div>
                        ))
                      ) : (
                        <Typography variant="body1" sx={{ 
                          color: '#aaa', 
                          py: 4, 
                          textAlign: 'center', 
                          gridColumn: '1 / -1',
                          fontStyle: 'italic'
                        }}>
                          На основе ваших жанров пока нет рекомендаций
                        </Typography>
                      )
                    )}
                    
                    {activeRecommendationTab === 1 && (
                      actorRecommendations.length > 0 ? (
                        actorRecommendations.map((recommendation) => (
                          <div className="seance-grid-item" key={recommendation.seanceId || recommendation.id}>
                            <SeanceCard 
                              seance={{
                                id: recommendation.seanceId || recommendation.id,
                                startTime: recommendation.startTime,
                                endTime: recommendation.endTime,
                                status: recommendation.status,
                                show: {
                                  id: recommendation.show.id,
                                  title: recommendation.show.title,
                                  poster: recommendation.show.poster,
                                  genre: recommendation.show.genre,
                                  description: recommendation.show.description,
                                  start_price: recommendation.show.start_price,
                                  theatre: {
                                    id: recommendation.show.theatre.id,
                                    name: recommendation.show.theatre.name,
                                    address: recommendation.show.theatre.address
                                  }
                                }
                              }} 
                            />
                          </div>
                        ))
                      ) : (
                        <Typography variant="body1" sx={{ 
                          color: '#aaa', 
                          py: 4, 
                          textAlign: 'center', 
                          gridColumn: '1 / -1',
                          fontStyle: 'italic'
                        }}>
                          На основе ваших актеров пока нет рекомендаций
                        </Typography>
                      )
                    )}
                    
                    {activeRecommendationTab === 2 && (
                      playwrightRecommendations.length > 0 ? (
                        playwrightRecommendations.map((recommendation) => (
                          <div className="seance-grid-item" key={recommendation.seanceId || recommendation.id}>
                            <SeanceCard 
                              seance={{
                                id: recommendation.seanceId || recommendation.id,
                                startTime: recommendation.startTime,
                                endTime: recommendation.endTime,
                                status: recommendation.status,
                                show: {
                                  id: recommendation.show.id,
                                  title: recommendation.show.title,
                                  poster: recommendation.show.poster,
                                  genre: recommendation.show.genre,
                                  description: recommendation.show.description,
                                  start_price: recommendation.show.start_price,
                                  theatre: {
                                    id: recommendation.show.theatre.id,
                                    name: recommendation.show.theatre.name,
                                    address: recommendation.show.theatre.address
                                  }
                                }
                              }} 
                            />
                          </div>
                        ))
                      ) : (
                        <Typography variant="body1" sx={{ 
                          color: '#aaa', 
                          py: 4, 
                          textAlign: 'center', 
                          gridColumn: '1 / -1',
                          fontStyle: 'italic'
                        }}>
                          На основе ваших режиссеров пока нет рекомендаций
                        </Typography>
                      )
                    )}
                  </div>
                  
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => loadAllRecommendations()}
                      sx={{
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        '&:hover': { borderColor: '#b71c1c' }
                      }}
                    >
                      Обновить рекомендации
                    </Button>
                  </Box>
                </Paper>
              )}
            </>
          )}

          {/* Вкладка "Мои комментарии" */}
          {activeMainTab === 2 && (
            <>
              <Typography variant="h4" sx={{ 
                mb: 3,
                fontWeight: 700,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Comment fontSize="large" sx={{color:'#d32f2f'}} />
                Мои комментарии
              </Typography>

              {loadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ color: '#d32f2f', mb: 2 }} size={40} />
                    <Typography variant="body1" sx={{ color: '#aaa' }}>
                      Загружаем ваши комментарии...
                    </Typography>
                  </Box>
                </Box>
              ) : !hasComments ? (
                <Paper elevation={4} sx={{ 
                  p: 4,
                  backgroundColor: '#2a2a2a',
                  textAlign: 'center',
                  borderRadius: 2
                }}>
                  <Comment sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography variant="h5" sx={{ mb: 2, color:"white" }}>
                    У вас пока нет комментариев
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
                    Оставляйте комментарии к просмотренным спектаклям, чтобы делиться впечатлениями с другими зрителями
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/')}
                    sx={{
                      bgcolor: '#d32f2f',
                      '&:hover': { bgcolor: '#b71c1c' }
                    }}
                  >
                    Посмотреть афишу
                  </Button>
                </Paper>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Всего комментариев: {userComments.length}
                  </Typography>
                  
                  {Object.entries(commentsGroupedByShow).map(([showId, showData]) => (
                    <Paper 
                      key={showId} 
                      elevation={4} 
                      sx={{ 
                        p: 3,
                        backgroundColor: '#2a2a2a',
                        borderRadius: 2,
                        mb: 3
                      }}
                    >
                      {/* Заголовок спектакля */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                          {showData.show.title}
                        </Typography>
                       
                      </Box>
                      
                      {/* Информация о спектакле */}
                      {showData.show.genre && (
                        <Box sx={{ mb: 2 }}>
                          <Chip 
                            label={showData.show.genre} 
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(211, 47, 47, 0.2)',
                              color: 'white',
                              fontWeight: 500
                            }} 
                          />
                        </Box>
                      )}
                      
                      {/* Комментарии пользователя к этому спектаклю */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Comment fontSize="small" />
                          Ваши отзывы ({showData.comments.length})
                        </Typography>
                        
                        {showData.comments.map((comment) => (
                          <Paper 
                            key={comment.ID || comment.id} 
                            elevation={1} 
                            sx={{ 
                              p: 2,
                              backgroundColor: 'rgba(42, 42, 42, 0.7)',
                              borderRadius: 2,
                              mb: 2,
                              borderLeft: '3px solid #d32f2f'
                            }}
                          >
                            {/* Заголовок комментария с датой */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday sx={{ fontSize: 16, color: '#aaa' }} />
                                <Typography variant="body2" sx={{ color: '#aaa' }}>
                                  {formatDate(comment.CreatedAt || comment.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Рейтинг */}
                            {(comment.Rating || comment.rating) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Star sx={{ fontSize: 16, color: '#d32f2f' }} />
                                <Rating 
                                  value={comment.Rating || comment.rating} 
                                  readOnly 
                                  size="small"
                                  sx={{ color: '#d32f2f' }}
                                  max={10}
                                />
                                <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                                  {(comment.Rating || comment.rating)}/10
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Текст комментария */}
                            <Typography variant="body1" sx={{ 
                              color: '#ddd', 
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.6
                            }}>
                              {comment.Content || comment.content}
                            </Typography>
                            
                            {/* Ответы на комментарий */}
                            {(comment.Replies || comment.replies) && 
                             (comment.Replies?.length > 0 || comment.replies?.length > 0) && (
                              <Box sx={{ mt: 2, pl: 2, borderLeft: '1px solid #444' }}>
                                <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                  Ответы ({comment.Replies?.length || comment.replies?.length}):
                                </Typography>
                                {(comment.Replies || comment.replies).map((reply, index) => (
                                  <Box 
                                    key={index} 
                                    sx={{ 
                                      mb: 1, 
                                      p: 1,
                                      backgroundColor: 'rgba(66, 66, 66, 0.5)',
                                      borderRadius: 1
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: '#4CAF50', display: 'block' }}>
                                      {reply.User?.Name || reply.user?.name} {reply.User?.Surname || reply.user?.surname}:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                                      {reply.Content || reply.content}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                  
                  {/* Общая статистика */}
                  <Paper elevation={4} sx={{ 
                    p: 3,
                    backgroundColor: '#2a2a2a',
                    borderRadius: 2,
                    mt: 4
                  }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Статистика комментариев
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                            {userComments.length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            Всего комментариев
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                            {Object.keys(commentsGroupedByShow).length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            Разных спектаклей
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'rgba(66, 165, 245, 0.1)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h4" sx={{ color: '#42a5f5', fontWeight: 700 }}>
                            {userComments.filter(c => c.Rating || c.rating).length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            С оценкой
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}
            </>
          )}

          {/* Вкладка "История" */}
          {activeMainTab === 3 && (
            <>
              <Typography variant="h4" sx={{ 
                mb: 3,
                fontWeight: 700,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <History fontSize="large" sx={{color:'#d32f2f'}} />
                История просмотров
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress color="secondary" />
                </Box>
              ) : !hasRatedTickets ? (
                <Paper elevation={4} sx={{ 
                  p: 4,
                  backgroundColor: '#2a2a2a',
                  textAlign: 'center',
                  borderRadius: 2
                }}>
                  <Typography variant="h5" sx={{ mb: 2, color:"white" }}>
                    У вас пока нет истории просмотров
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#aaa', mb: 3 }}>
                    После оценки спектаклей они появятся здесь
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => setActiveMainTab(0)}
                    sx={{
                      bgcolor: '#d32f2f',
                      '&:hover': { bgcolor: '#b71c1c' }
                    }}
                  >
                    {hasUnratedPastTickets ? "Перейти к оценке" : "Перейти к билетам"}
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {ratedTickets.map(ticket => (
                    <Grid item xs={12} key={ticket.id}>
                      <Paper elevation={4} sx={{ 
                        p: 3,
                        backgroundColor: '#1a1a1a',
                        borderRadius: 2,
                        borderLeft: '4px solid #616161',
                        opacity: 0.8,
                        '&:hover': {
                          opacity: 1,
                          backgroundColor: '#222222'
                        }
                      }}>
                        <Grid container spacing={2}>
                          {/* Информация о спектакле */}
                          <Grid item xs={12} md={8}>
                            <Typography variant="h5" sx={{ color: '#aaa', mb: 1 }}>
                              {ticket.show.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              <Chip 
                                label={ticket.show.genre} 
                                size="small"
                                sx={{ 
                                  backgroundColor: '#424242',
                                  color: '#aaa'
                                }} 
                              />
                              <Chip 
                                label={`${ticket.rowNumber} ряд, ${ticket.seatNumber} место`}
                                size="small"
                                sx={{ 
                                  backgroundColor: '#424242',
                                  color: '#aaa'
                                }} 
                              />
                              
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday sx={{ fontSize: 16, color: '#666' }} />
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                  {formatSeanceDate(ticket.startTime)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime sx={{ fontSize: 16, color: '#666' }} />
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                  {formatSeanceTime(ticket.startTime)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                              <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                              {ticket.show.theatre.name}, {ticket.show.theatre.address}
                            </Typography>
                            
                            {/* Статус оценки */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Star sx={{ fontSize: 16, color: '#4CAF50' }} />
                              <Typography variant="body2" sx={{ 
                                color: '#4CAF50',
                                fontWeight: 500
                              }}>
                                Оценён
                              </Typography>
                            </Box>
                            
                            {/* Действия */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              {/* Кнопка комментария - всегда доступна */}
                              <Button
                                variant="outlined"
                                startIcon={<Comment />}
                                onClick={() => navigate(`/comment/${ticket.show.id}/${store.user.id}`)}
                                sx={{
                                  color: '#d32f2f',
                                  borderColor: '#d32f2f',
                                  '&:hover': { 
                                    borderColor: '#b71c1c',
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)'
                                  }
                                }}
                              >
                                Прокомментировать
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default ClientDashboard;