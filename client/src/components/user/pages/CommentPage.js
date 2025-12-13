import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Rating, 
  Avatar, 
  Chip, 
  Divider, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { Context } from '../../..'; 
import { getYandexDiskFileUrl } from "../../manager/yandex/disk";
import Header from '../components/Header';
import './page-styles/CommentPage.css';

const CommentPage = () => {
  const { showId, userId } = useParams();
  const navigate = useNavigate();
  const { store } = useContext(Context);
  
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posterUrl, setPosterUrl] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Состояния для нового комментария
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  
  // Состояния для ответа на комментарий
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Состояния для редактирования
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // Диалоговые окна
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  
  // Загрузка информации о постановке
  useEffect(() => {
    const loadShowData = async () => {
      try {
        setLoading(true);
        const showData = await store.getShowsWithDetailsById(showId);
        setShow(showData);
        
        // Загрузка постера
        if (showData.poster) {
          const filePath = showData.poster.replace("https://webdav.yandex.ru", "");
          const url = await getYandexDiskFileUrl(filePath);
          setPosterUrl(url);
        }
      } catch (error) {
        console.error('Ошибка загрузки постановки:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (showId) {
      loadShowData();
      loadComments();
    }
  }, [showId, store]);
  
  // Загрузка комментариев
  // Загрузка комментариев
const loadComments = async () => {
  try {
    setLoadingComments(true);
    const response = await store.getShowComments(showId);
    console.log("COMMENTS RESPONSE:", response);
    
    // Если response содержит поле data, берем его
    const commentsData = response.data || response;
    console.log("COMMENTS DATA:", commentsData);
    
    // Проверяем структуру данных
    if (Array.isArray(commentsData)) {
      console.log("Комментарии загружены как массив, длина:", commentsData.length);
      setComments(commentsData);
    } else if (commentsData && commentsData.success && commentsData.data) {
      console.log("Комментарии загружены с полем success");
      setComments(commentsData.data);
    } else {
      console.log("Неизвестный формат комментариев:", commentsData);
      setComments([]);
    }
  } catch (error) {
    console.error('Ошибка загрузки комментариев:', error);
    setComments([]);
  } finally {
    setLoadingComments(false);
  }
};
  
  // Создание комментария
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await store.createComment(userId, showId, newComment, rating || null);
      setNewComment('');
      setRating(0);
      loadComments(); // Перезагружаем комментарии
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
      alert(error.message);
    }
  };
  
  // Ответ на комментарий
  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !replyTo) return;
    
    try {
      console.log("USERID IN REPPLY"+userId);
      await store.replyComment(userId, replyTo.ID, replyContent);
      setReplyContent('');
      setReplyTo(null);
      loadComments();
    } catch (error) {
      console.error('Ошибка создания ответа:', error);
      alert(error.message);
    }
  };
  
  // Редактирование комментария
  const handleEditSubmit = async () => {
    if (!editContent.trim() || !editingComment) return;
    
    try {
      await store.updateComment(userId, editingComment.ID, editContent);
      setEditContent('');
      setEditingComment(null);
      loadComments();
    } catch (error) {
      console.error('Ошибка редактирования комментария:', error);
      alert(error.message);
    }
  };
  
  // Удаление комментария
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      await store.deleteComment(userId, commentToDelete.ID);
      setDeleteDialog(false);
      setCommentToDelete(null);
      loadComments();
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      alert(error.message);
    }
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
  
  // Форматирование длительности
  const formatDuration = (minutes) => {
    if (!minutes) return "Не указана";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}мин` : `${mins}мин`;
  };
  
 const renderComments = (commentsList, depth = 0) => {
  return commentsList.map((comment) => {
    const isDeleted = comment.Status === 'deleted';
    const isReply = comment.ParentComment_id !== null;
    
    return (
      <Box 
        key={comment.ID} 
        sx={{ 
          ml: depth * 4, 
          mb: 2,
          p: 2,
          backgroundColor: depth > 0 ? 'rgba(42, 42, 42, 0.5)' : 'rgba(42, 42, 42, 0.7)',
          borderRadius: '8px',
          borderLeft: depth > 0 ? '2px solid #d32f2f' : 'none',
          opacity: isDeleted ? 0.7 : 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: isDeleted ? '#666' : '#d32f2f',
            opacity: isDeleted ? 0.5 : 1
          }}>
            {isDeleted ? '🚫' : (comment.User?.Name?.[0] || 'U')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ 
                  color: isDeleted ? '#888' : 'white', 
                  fontWeight: 'bold',
                  fontStyle: isDeleted ? 'italic' : 'normal'
                }}>
                  {isDeleted ? 'Удалённый комментарий' : `${comment.User?.Name} ${comment.User?.Surname}`}
                </Typography>
                {isReply && !isDeleted && (
                  <Chip 
                    label="Ответ" 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(211, 47, 47, 0.2)', 
                      color: '#d32f2f',
                      fontSize: '0.7rem',
                      height: '20px'
                    }} 
                  />
                )}
              </Box>
              <Typography sx={{ 
                color: isDeleted ? '#666' : '#aaa', 
                fontSize: '0.9rem',
                fontStyle: isDeleted ? 'italic' : 'normal'
              }}>
                {formatDate(comment.CreatedAt)}
              </Typography>
            </Box>
            
            {/* Если это ответ, можно показать, на кого отвечали */}
            {isReply && comment.ParentComment && !isDeleted && (
              <Typography 
                sx={{ 
                  color: '#888', 
                  fontSize: '0.8rem', 
                  mb: 1,
                  fontStyle: 'italic'
                }}
              >
                Ответ пользователю {comment.ParentComment.User?.Name} {comment.ParentComment.User?.Surname}
              </Typography>
            )}
            
            {!isDeleted && comment.Rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
                  Оценка:
                </Typography>
                <Rating 
                  value={comment.Rating} 
                  readOnly 
                  size="small"
                  sx={{ color: '#d32f2f' }}
                />
                <Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
                  {comment.Rating}/10
                </Typography>
              </Box>
            )}
            
            <Typography sx={{ 
              color: isDeleted ? '#888' : '#ddd', 
              mb: 2, 
              whiteSpace: 'pre-wrap',
              fontStyle: isDeleted ? 'italic' : 'normal'
            }}>
              {comment.Content}
            </Typography>
            
            {/* Кнопки действий */}
            {!isDeleted && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Ответить можно только на корневые комментарии */}
                {!isReply && (
                  <Button
                    startIcon={<MessageIcon />}
                    onClick={() => {
                      setReplyTo(comment);
                      setReplyContent('');
                    }}
                    size="small"
                    sx={{ 
                      color: '#d32f2f',
                      textTransform: 'none',
                      fontSize: '0.8rem'
                    }}
                  >
                    Ответить
                  </Button>
                )}
                
                {/* Редактировать и удалить можно свои комментарии */}
                {comment.User_id == userId && (
                  <>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingComment(comment);
                        setEditContent(comment.Content);
                      }}
                      size="small"
                      sx={{ 
                        color: '#4CAF50',
                        textTransform: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      Редактировать
                    </Button>
                    
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setCommentToDelete(comment);
                        setDeleteDialog(true);
                      }}
                      size="small"
                      sx={{ 
                        color: '#f44336',
                        textTransform: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      Удалить
                    </Button>
                  </>
                )}
              </Box>
            )}
            
            {/* Ответы на комментарий */}
            {comment.Replies && comment.Replies.length > 0 && (
              <Box sx={{ mt: 3, borderTop: '1px solid #444', pt: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                  Ответы ({comment.Replies.length}):
                </Typography>
                {renderComments(comment.Replies, depth + 1)}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  });
};
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#121212'
      }}>
        <CircularProgress sx={{ color: '#d32f2f' }} />
      </Box>
    );
  }
  
  if (!show) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#121212',
        color: 'white'
      }}>
        Постановка не найдена
      </Box>
    );
  }
  
  return (
    <div className="comment-page">
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Кнопка назад */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3, 
            color: '#d32f2f',
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            }
          }}
        >
          Назад
        </Button>
        
        {/* Карточка постановки */}
        <Paper elevation={3} sx={{ 
          mb: 4, 
          p: 3, 
          backgroundColor: '#2a2a2a',
          borderRadius: '12px'
        }}>
          <Grid container spacing={3}>
            {/* Постер */}
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <CardMedia
                  component="img"
                  image={posterUrl || '/placeholder-poster.jpg'}
                  alt={show.title}
                  sx={{ 
                    borderRadius: '8px',
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-poster.jpg';
                  }}
                />
                <CardContent sx={{ p: 1 }}>
                  <Chip 
                    label={show.genre} 
                    sx={{ 
                      backgroundColor: '#d32f2f', 
                      color: 'white',
                      fontWeight: 'bold',
                      mt: 1
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            {/* Информация о постановке */}
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="h3" sx={{ 
                  color: 'white', 
                  mb: 2,
                  fontWeight: 600,
                  fontFamily: "'Cormorant', serif"
                }}>
                  {show.title}
                </Typography>
                
                {show.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <StarIcon sx={{ color: '#d32f2f' }} />
                    <Typography variant="h6" sx={{ color: '#d32f2f' }}>
                      Рейтинг: {show.rating}/10
                    </Typography>
                  </Box>
                )}
                
                {/* Детали постановки */}
                <Box sx={{ mb: 3 }}>
                  {show.duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: '#d32f2f', fontSize: '1.2rem' }} />
                      <Typography sx={{ color: 'white' }}>
                        <strong>Длительность:</strong> {formatDuration(show.duration)}
                      </Typography>
                    </Box>
                  )}
                  
                  {show.partsCount && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MenuBookIcon sx={{ color: '#d32f2f', fontSize: '1.2rem' }} />
                      <Typography sx={{ color: 'white' }}>
                        <strong>Количество частей:</strong> {show.partsCount}
                      </Typography>
                    </Box>
                  )}
                  
                  {show.ageRestriction && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ color: '#d32f2f', fontSize: '1.2rem' }} />
                      <Typography sx={{ color: 'white' }}>
                        <strong>Возрастное ограничение:</strong> {show.ageRestriction}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationOnIcon sx={{ color: '#d32f2f', fontSize: '1.2rem' }} />
                    <Typography sx={{ color: 'white' }}>
                      <strong>Театр:</strong> {show.theatre?.name || 'Не указан'}
                    </Typography>
                  </Box>
                  
                  {show.theatre?.address && (
                    <Typography sx={{ color: 'white', ml: 3 }}>
                      {show.theatre.address}
                    </Typography>
                  )}
                </Box>
                
                {/* Описание */}
                <Divider sx={{ my: 2, bgcolor: '#444' }} />
                
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  Описание
                </Typography>
                <Typography sx={{ color: '#ddd', lineHeight: 1.6 }}>
                  {show.description || 'Описание отсутствует'}
                </Typography>
                
                {/* Актёры */}
                {show.actors && show.actors.length > 0 && (
                  <>
                    <Divider sx={{ my: 2, bgcolor: '#444' }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                      В ролях
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {show.actors.map((actor, index) => (
                        <Chip
                          key={index}
                          label={`${actor.name} ${actor.surname}${actor.role ? ` (${actor.role})` : ''}`}
                          sx={{ 
                            color: 'white',
                            backgroundColor: 'rgba(211, 47, 47, 0.2)',
                            '&:hover': {
                              backgroundColor: 'rgba(211, 47, 47, 0.3)'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Основной контент: комментарии */}
        <Paper elevation={3} sx={{ 
          p: 3, 
          backgroundColor: '#2a2a2a',
          borderRadius: '12px'
        }}>
          <Typography variant="h4" sx={{ 
            color: 'white', 
            mb: 3,
            fontWeight: 600,
            fontFamily: "'Cormorant', serif"
          }}>
            Ваш отзыв о постановке
          </Typography>
          
          {/* Форма нового комментария */}
          <Box sx={{ mb: 4, p: 3, backgroundColor: 'rgba(42, 42, 42, 0.8)', borderRadius: '8px' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Оставьте ваш отзыв
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Поделитесь вашими впечатлениями о постановке..."
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#d32f2f' },
                  '&.Mui-focused fieldset': { borderColor: '#d32f2f' }
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#aaa' }}>Ваша оценка:</Typography>
                <Rating
                  value={rating}
                  onChange={(_, newValue) => setRating(newValue)}
                  sx={{ color: '#d32f2f' }}
                />
              </Box>
              
              <Button
                variant="contained"
                startIcon={<SendIcon />} 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                sx={{ 
                  backgroundColor: '#d32f2f',
                  '&:hover': { backgroundColor: '#b71c1c' },
                  '&:disabled': { backgroundColor: '#666' }
                }}
              >
                Отправить отзыв
              </Button>
            </Box>
          </Box>
          
          {/* Форма ответа на комментарий */}
          {replyTo && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(42, 42, 42, 0.9)', borderRadius: '8px', borderLeft: '3px solid #d32f2f' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Ответ пользователю {replyTo.User?.Name} {replyTo.User?.Surname}:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Ваш ответ..."
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#d32f2f' }
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setReplyTo(null)}
                  sx={{ color: '#aaa', borderColor: '#555' }}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
                >
                  Отправить ответ
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Форма редактирования комментария */}
          {editingComment && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(42, 42, 42, 0.9)', borderRadius: '8px', borderLeft: '3px solid #4CAF50' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Редактирование комментария:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#4CAF50' }
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setEditingComment(null)}
                  sx={{ color: '#aaa', borderColor: '#555' }}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEditSubmit}
                  disabled={!editContent.trim()}
                  sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#388E3C' } }}
                >
                  Сохранить
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Список комментариев */}
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
            Отзывы других зрителей ({comments.length})
          </Typography>
          
          {loadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress sx={{ color: '#d32f2f' }} />
            </Box>
          ) : comments.length > 0 ? (
            <Box>
              {renderComments(comments)}
            </Box>
          ) : (
            <Typography sx={{ color: '#aaa', textAlign: 'center', my: 4 }}>
              Пока нет отзывов. Будьте первым!
            </Typography>
          )}
        </Paper>
      </Container>
      
      {/* Диалог удаления комментария */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: 'white'
          }
        }}
      >
        <DialogTitle>Удаление комментария</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#ddd' }}>
            Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog(false)}
            sx={{ color: '#aaa' }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteComment}
            sx={{ color: '#f44336' }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CommentPage;