import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Divider, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Rating,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  TheaterComedy, 
  Schedule, 
  Chair, 
  ConfirmationNumber, 
  StarBorder, 
  Star, 
  Cancel,
  Chat // Добавлен иконка для комментариев
} from '@mui/icons-material';
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import { useNavigate } from 'react-router-dom'; // Добавлен useNavigate

const TicketCard = ({ ticket, onDelete, onRated }) => {
  const { store } = useContext(Context);
  const navigate = useNavigate(); // Добавлен navigate
  const [openDelete, setOpenDelete] = useState(false);
  const [openRate, setOpenRate] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(-1);
  const [isPast, setIsPast] = useState(ticket.ticketInfo.status === 'Не активно');
  const [isCancelled, setIsCancelled] = useState(ticket.status === 'Отменён');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const checkRating = async () => {
      setIsCancelled(ticket.status === 'Отменён');
      if (isPast) {
        try {
          const rated = await store.checkUserRating(store.user.id, ticket.show.id);
          setHasRated(rated);
        } catch (err) {
          console.error('Ошибка проверки оценки:', err);
        }
      }
    };
    
    checkRating();
  }, [isPast, store, ticket.show.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);

  const handleOpenRate = () => setOpenRate(true);
  const handleCloseRate = () => {
    setOpenRate(false);
    setRating(0);
  };

  // Функция для перехода на страницу комментариев
  const handleCommentClick = () => {
    navigate(`/comment/${ticket.show.id}/${store.user.id}`);
  };

  const handleDelete = async () => {
    try {
      await onDelete(ticket.id);
      handleCloseDelete();
    } catch(err) {
      console.error('Delete error:', err);
    }
  };

  const handleImmediateDelete = async () => {
    try {
      await onDelete(ticket.id);
    } catch(err) {
      console.error('Delete error:', err);
    }
  };

  const handleRate = async () => {
    try {
      await store.rateShow(store.user.id, ticket.show.id, rating);
      setSnackbarOpen(true);
      setHasRated(true);
      onRated(ticket.id); // Уведомляем родительский компонент
      handleCloseRate();
    } catch(err) {
      console.error('Rating error:', err);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 3, 
          backgroundColor: isCancelled ? '#1a1a1a' : isPast ? '#1a1a1a' : '#2a2a2a',
          borderLeft: `4px solid ${isCancelled ? '#9e9e9e' : isPast ? '#616161' : '#d32f2f'}`,
          borderRadius: '8px',
          transition: 'transform 0.2s',
          opacity: isCancelled ? 0.6 : isPast ? 0.7 : 1,
          '&:hover': {
            transform: isCancelled ? 'none' : 'translateY(-2px)',
            boxShadow: isCancelled ? 'none' : '0 4px 8px rgba(0,0,0,0.3)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: isCancelled ? '#9e9e9e' : 'white',
              textDecoration: isCancelled ? 'line-through' : 'none'
            }}>
              {ticket.show.title}
            </Typography>
            {isCancelled ? (
              <Chip 
                label="ОТМЕНЁН" 
                color="error"
                icon={<Cancel />}
                sx={{ 
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              />
            ) : (
              <Chip 
                label={ticket.show.genre} 
                color="primary" 
                sx={{ 
                  backgroundColor: isPast ? '#616161' : '#d32f2f', 
                  color: 'white',
                  fontSize:'1.3rem', 
                }}
              />
            )}
          </Box>

          {!isCancelled && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'white' }}>
                <TheaterComedy sx={{ color: isPast ? '#616161' : '#d32f2f', mr: 1 }} />
                <Typography sx={{fontSize:'1.4rem'}}>{ticket.show.theatre.name}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'white' }}>
                <Schedule sx={{ color: isPast ? '#616161' : '#d32f2f', mr: 1 }} />
                <Typography sx={{fontSize:'1.4rem'}}>
                  {formatDate(ticket.startTime)} • {formatTime(ticket.startTime)} - {formatTime(ticket.endTime)}
                </Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 2, bgcolor: '#444' }} />

          {!isCancelled ? (
            <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chair sx={{ color: isPast ? '#616161' : '#d32f2f', mr: 1 }} />
                <Box>
                 <Typography variant="h6">{ticket.rowtype}</Typography>
                   
                  <Typography variant="h5">Ряд {ticket.rowNumber}</Typography>
                  
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ConfirmationNumber sx={{ color: isPast ? '#616161' : '#d32f2f', mr: 1 }} />
                <Box>
                  <Typography variant="h6">Место</Typography>
                  <Typography variant="h5">{ticket.seatNumber}</Typography>
                </Box>
              </Box>

              <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                <Typography variant="h5">Стоимость</Typography>
                <Typography variant="h4" sx={{ color: isPast ? '#616161' : '#d32f2f' }}>
                  {ticket.ticketInfo.totalPrice} BYN
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" sx={{ color: '#9e9e9e', mb: 1 }}>
                Сеанс был отменён
              </Typography>
              <Typography variant="h6" sx={{ color: '#757575' }}>
                Приносим извинения от лица соощества
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Chip 
              label={
                isCancelled ? 'ОТМЕНЁН' : 
                isPast ? 'Прошедший сеанс' : 
                ticket.ticketInfo.status === 'paid' ? 'Оплачен' : 'Оплата в кассе'
              }
              sx={{ 
                backgroundColor: 
                  isCancelled ? '#9e9e9e' : 
                  isPast ? '#616161' : 
                  ticket.ticketInfo.status === 'paid' ? '#4CAF50' : '#d32f2f',
                color: 'white',
                fontWeight: isCancelled ? 'bold' : 'normal',
                fontSize:'1.3rem'
              }}
            />
            
            {isCancelled ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  disabled
                  sx={{
                    backgroundColor: '#9e9e9e',
                    color: 'white',
                    cursor: 'not-allowed',
                    fontSize:'1.3rem'
                  }}
                >
                  Бронь отменена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImmediateDelete}
                  sx={{
                    backgroundColor: '#616161',
                    color: 'white',
                    fontSize:'1.3rem',
                    '&:hover': {
                      backgroundColor: '#d32f2f'
                    },
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  Удалить
                </Button>
              </Box>
            ) : isPast ? (
              <Box sx={{ display: 'flex', gap: 2 }}> {/* Изменено: обертка для двух кнопок */}
                <Button
                  variant="contained"
                  onClick={handleOpenRate}
                  disabled={hasRated}
                  startIcon={<Star />} // Добавлена иконка
                  sx={{
                    backgroundColor: hasRated ? '#9e9e9e' : '#616161',
                    fontSize:'1.3rem',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: hasRated ? '#9e9e9e' : '#d32f2f'
                    },
                    transition: 'background-color 0.3s ease',
                    minWidth: '200px' // Фиксированная ширина для одинаковых кнопок
                  }}
                >
                  {hasRated ? 'Вы уже оценили' : 'Хотите оценить?'}
                </Button>
                
                {/* Новая кнопка для комментариев */}
                <Button
                  variant="contained"
                  onClick={handleCommentClick}
                  startIcon={<Chat />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    fontSize:'1.3rem',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#388E3C'
                    },
                    transition: 'background-color 0.3s ease',
                    minWidth: '200px' // Фиксированная ширина для одинаковых кнопок
                  }}
                >
                  Хотите прокомментировать?
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleOpenDelete}
                sx={{
                  backgroundColor: '#616161',
                  color: 'white',
                  fontSize:'1.1rem',
                  '&:hover': {
                    backgroundColor: '#d32f2f'
                  },
                  transition: 'background-color 0.3s ease'
                }}
              >
                Отменить бронь
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Диалог отмены брони */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: '#2a2a2a',
            color: 'white',
            borderRadius: '8px',
            borderLeft: '4px solid #d32f2f'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: 'white', borderBottom: '1px solid #444' }}>
          Подтверждение отмены брони
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#aaa', mt: 2 }}>
            Вы точно хотите отменить бронь на {ticket.show.title} ({formatDate(ticket.startTime)} в {formatTime(ticket.startTime)})?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #444', padding: '16px 24px' }}>
          <Button 
            onClick={handleCloseDelete} 
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Нет
          </Button>
          <Button 
            onClick={handleDelete} 
            autoFocus
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c'
              }
            }}
          >
            Да, отменить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог оценки сеанса */}
      <Dialog
        open={openRate}
        onClose={handleCloseRate}
        aria-labelledby="rate-dialog-title"
        PaperProps={{
          style: {
            backgroundColor: '#2a2a2a',
            color: 'white',
            borderRadius: '8px',
            borderLeft: '4px solid #d32f2f'
          }
        }}
      >
        <DialogTitle id="rate-dialog-title" sx={{ color: 'white', borderBottom: '1px solid #444' }}>
          Оцените сеанс
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
              {ticket.show.title}
            </Typography>
            <Rating
              name="show-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              onChangeActive={(event, newHover) => {
                setHover(newHover);
              }}
              max={10}
              precision={1}
              size="large"
              emptyIcon={<StarBorder fontSize="inherit" sx={{ color: '#616161' }} />}
              icon={<Star fontSize="inherit" sx={{ color: '#d32f2f' }} />}
              sx={{
                fontSize: '2.5rem',
                '& .MuiRating-iconFilled': {
                  color: '#d32f2f',
                },
                '& .MuiRating-iconHover': {
                  color: '#b71c1c',
                },
              }}
            />
            <Typography sx={{ mt: 2, color: '#aaa' }}>
              {rating !== null && (
                <span>Ваша оценка: {hover !== -1 ? hover : rating} из 10</span>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #444', padding: '16px 24px' }}>
          <Button 
            onClick={handleCloseRate} 
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRate} 
            disabled={rating === 0}
            autoFocus
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b71c1c'
              },
              '&:disabled': {
                backgroundColor: '#616161',
                color: '#aaa'
              }
            }}
          >
            Отправить оценку
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомление об успешной оценке */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success"
          sx={{ width: '100%', backgroundColor: '#4CAF50', color: 'white' }}
        >
          Оценка успешно добавлена!
        </Alert>
      </Snackbar>
    </>
  );
};

export default TicketCard;