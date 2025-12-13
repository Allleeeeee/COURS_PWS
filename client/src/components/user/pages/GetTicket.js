import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  Tooltip, 
  CircularProgress, 
  Snackbar, 
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle 
} from "@mui/material";
import { CalendarDays, MapPin, ArrowLeft } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import "./page-styles/GetTicket.css";

const priceColors = {
  5: "#7FB3D5",
  10: "#3498DB",
  12: "#27AE60",
  15: "#9B59B6",
  17: "#E67E22",
  20: "#F1C40F",
  25: "#A04000",
  30: "#F78FB3",
  35: "#6D214F",
};

const GetTicket = observer(() => {
  const { store } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [rows, setRows] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [seanceInfo, setSeanceInfo] = useState(null);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [basePrice, setBasePrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allSeances = await store.getSeancesWithDetails();
        const found = allSeances.data.find(s => s.id.toString() === id);
        
        if (!found) throw new Error("Сеанс не найден");
        
        setSeanceInfo(found);
        setBasePrice(found.show.start_price || 0);
        
        if (!found.show || !found.show.theatre?.id) {
          throw new Error("Не удалось получить theatre_id");
        }
        
        const fetchedRows = await store.getRowsByTheatre(found.show.theatre.id);
        // Добавляем базовую цену к каждой наценке
        const rowsWithTotalPrice = fetchedRows.map(row => ({
          ...row,
          totalPrice: (Number(row.PriceMarkUp) || 0) + (Number(found.show.start_price) || 0)
        }));
        setRows(rowsWithTotalPrice);
      } catch (err) {
        setError(err.message || "Ошибка загрузки данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [id, store]);

  useEffect(() => {
    const fetchBookedSeats = async () => {
      if (!seanceInfo?.id) return;
      
      try {
        const response = await store.getStatus(seanceInfo.id);
        setBookedSeatIds(response.bookedSeatIds);
      } catch (err) {
        console.error('Ошибка загрузки занятых мест:', err);
      }
    };
  
    fetchBookedSeats();
  }, [id, seanceInfo?.id]);

  const handleSeatClick = (seatId, rowId) => {
    setSelectedSeats(prev => {
      if (prev.some(seat => seat.seatId === seatId)) {
        return prev.filter(seat => seat.seatId !== seatId);
      }
      return [...prev, { seatId, rowId }];
    });
  };

  const handleBookTickets = async () => {
    if (selectedSeats.length === 0) return;
    
    try {
      setLoading(true);
      
      const bookingPromises = selectedSeats.map(seat => 
        store.getTicket(id, seat.seatId, store.user.id)
      );
      
      await Promise.all(bookingPromises);
      setSuccess(true);
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка бронирования билетов");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOpen = () => setConfirmOpen(true);
  const handleConfirmClose = () => setConfirmOpen(false);
  const handleConfirmBooking = () => {
    handleConfirmClose();
    handleBookTickets();
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  const leftBoxes = ["Ложа балкона левая", "Ложа бельэтажа левая"];
  const rightBoxes = ["Ложа балкона правая", "Ложа бельэтажа правая"];
  const centerSections = ["Балкон", "Партер", "Амфитеатр", "Бельэтаж"];

  if (loading && !rows.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" bgcolor="#1a1a1a">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh" bgcolor="#1a1a1a">
        <Typography variant="h6" color="error" gutterBottom>
          Ошибка
        </Typography>
        <Typography variant="body1" gutterBottom color="white">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Попробовать снова
        </Button>
      </Box>
    );
  }

  return (
    <Box className="seance-details-container" bgcolor="#1a1a1a" color="white" minHeight="100vh">
      <Button 
        startIcon={<ArrowLeft />} 
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: "#d32f2f", fontSize:'1rem' }}
      >
        Назад
      </Button>

      {seanceInfo && (
        <Box className="seance-header" mb={4} bgcolor="#2a2a2a" p={3} borderRadius={2}>
          <Typography variant="h4" className="seance-title" color="white">
            {seanceInfo.show?.title}
          </Typography>
          <Box className="seance-meta">
            <Box display="flex" alignItems="center" mr={3}>
              <CalendarDays size={20} color="#d32f2f" />
              <Typography variant="h6" ml={1} color="white">
                {new Date(seanceInfo.startTime).toLocaleDateString()} в{' '}
                {new Date(seanceInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <MapPin size={20} color="#d32f2f" />
              <Typography variant="h6" ml={1} color="white">
                {seanceInfo.show?.theatre?.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Typography variant="h5" gutterBottom textAlign="center" mb={3} color="white">
        Выберите место
      </Typography>

      <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} mb={4}>
        {Object.entries(priceColors).map(([markUp, color]) => {
          const totalPrice = Number(markUp) + Number(basePrice);
          return (
            <Box key={markUp} display="flex" alignItems="center" mr={2}>
              <Box width={16} height={16} borderRadius="50%" bgcolor={color} mr={1} />
              <Typography variant="body2" color="white">{totalPrice} BYN</Typography>
            </Box>
          );
        })}
      </Box>

      <Box className="hall-container" bgcolor="#1a1a1a">
        <Box className="hall-layout">
          {/* Левая боковая часть */}
          <Box className="hall-side-section">
            {leftBoxes.map(type => (
              <Box key={type} className="hall-box-section">
                <Typography variant="subtitle2" className="section-title" color="white">{type}</Typography>
                {rows
                  .filter(row => row.RowType === type)
                  .sort((a, b) => b.RowNumber - a.RowNumber)
                  .map(row => (
                    <Box key={row.ID} className="hall-row">
                      <Typography variant="body2" className="row-number" color="white">{row.RowNumber}:</Typography>
                      <Box className="hall-seats">
                        {row.Seats?.map(seat => {
                          const isSelected = selectedSeats.some(s => s.seatId === seat.ID);
                          const isBooked = bookedSeatIds.includes(seat.ID);
                          const priceKey = Number(row.PriceMarkUp);
                          const color = isBooked ? '#333333' : (priceColors[priceKey] || "grey");
                          
                          return (
                            <Tooltip 
                              key={seat.ID} 
                              title={isBooked ? 'Место занято' : `Место ${seat.SeatNumber} - ${row.totalPrice} BYN`} 
                              arrow
                            >
                              <Box 
                                className={`hall-seat ${isSelected ? 'selected-seat' : ''} ${isBooked ? 'booked-seat' : ''}`}
                                onClick={isBooked ? undefined : () => handleSeatClick(seat.ID, row.ID)}
                                style={{
                                  backgroundColor: color,
                                  transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                  boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  opacity: isBooked ? 0.7 : 1
                                }}
                              >
                                {!isBooked && (
                                  <Typography variant="caption" className="seat-number">
                                    {seat.SeatNumber}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
              </Box>
            ))}
          </Box>

          {/* Центральная часть */}
          <Box className="hall-center-section">
            {centerSections.map(type => (
              <Box key={type} className="hall-center-box">
                <Typography variant="subtitle1" className="section-title" color="white">{type}</Typography>
                {rows
                  .filter(row => row.RowType === type)
                  .sort((a, b) => b.RowNumber - a.RowNumber)
                  .map(row => (
                    <Box key={row.ID} className="hall-row">
                      <Typography variant="body2" className="row-number" color="white">{row.RowNumber}:</Typography>
                      <Box className="hall-seats">
                        {row.Seats?.map(seat => {
                          const isSelected = selectedSeats.some(s => s.seatId === seat.ID);
                          const isBooked = bookedSeatIds.includes(seat.ID);
                          const priceKey = Number(row.PriceMarkUp);
                          const color = isBooked ? '#333333' : (priceColors[priceKey] || "grey");
                          
                          return (
                            <Tooltip 
                              key={seat.ID} 
                              title={isBooked ? 'Место занято' : `Место ${seat.SeatNumber} - ${row.totalPrice} BYN`} 
                              arrow
                            >
                              <Box 
                                className={`hall-seat ${isSelected ? 'selected-seat' : ''} ${isBooked ? 'booked-seat' : ''}`}
                                onClick={isBooked ? undefined : () => handleSeatClick(seat.ID, row.ID)}
                                style={{
                                  backgroundColor: color,
                                  transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                  boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  opacity: isBooked ? 0.7 : 1
                                }}
                              >
                                {!isBooked && (
                                  <Typography variant="caption" className="seat-number">
                                    {seat.SeatNumber}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
              </Box>
            ))}
            <Box className="hall-stage">
              <Typography variant="h6" className="stage-text">СЦЕНА</Typography>
            </Box>
          </Box>

          {/* Правая боковая часть */}
          <Box className="hall-side-section">
            {rightBoxes.map(type => (
              <Box key={type} className="hall-box-section">
                <Typography variant="subtitle2" className="section-title" color="white">{type}</Typography>
                {rows
                  .filter(row => row.RowType === type)
                  .sort((a, b) => b.RowNumber - a.RowNumber)
                  .map(row => (
                    <Box key={row.ID} className="hall-row">
                      <Typography variant="body2" className="row-number" color="white">{row.RowNumber}:</Typography>
                      <Box className="hall-seats">
                        {row.Seats?.map(seat => {
                          const isSelected = selectedSeats.some(s => s.seatId === seat.ID);
                          const isBooked = bookedSeatIds.includes(seat.ID);
                          const priceKey = Number(row.PriceMarkUp);
                          const color = isBooked ? '#333333' : (priceColors[priceKey] || "grey");
                          
                          return (
                            <Tooltip 
                              key={seat.ID} 
                              title={isBooked ? 'Место занято' : `Место ${seat.SeatNumber} - ${row.totalPrice} BYN`} 
                              arrow
                            >
                              <Box 
                                className={`hall-seat ${isSelected ? 'selected-seat' : ''} ${isBooked ? 'booked-seat' : ''}`}
                                onClick={isBooked ? undefined : () => handleSeatClick(seat.ID, row.ID)}
                                style={{
                                  backgroundColor: color,
                                  transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                  boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  opacity: isBooked ? 0.7 : 1
                                }}
                              >
                                {!isBooked && (
                                  <Typography variant="caption" className="seat-number">
                                    {seat.SeatNumber}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          variant="contained"
          size="large"
          disabled={selectedSeats.length === 0 || loading}
          onClick={handleConfirmOpen}
          sx={{ 
            padding: "12px 24px",
            fontSize: "1.1rem",
            backgroundColor: "#d32f2f",
            "&:hover": { backgroundColor: "#b71c1c" }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Забронировать (${selectedSeats.length})`}
        </Button>
      </Box>

      {selectedSeats.length > 0 && (
        <Box textAlign="center" mt={2} color="white">
          <Typography variant="body1">
            Выбрано мест: {selectedSeats.length}
          </Typography>
          {selectedSeats.map(seat => {
            const row = rows.find(r => r.ID === seat.rowId);
            const seatNumber = row?.Seats?.find(s => s.ID === seat.seatId)?.SeatNumber;
            return (
              <Typography key={seat.seatId} variant="body2">
                Ряд {row?.RowNumber}, Место {seatNumber} - {row?.totalPrice} BYN
              </Typography>
            );
          })}
        </Box>
      )}

      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: "#2a2a2a",
            color: "white"
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" color="white">
          Подтверждение бронирования
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" color="white">
            Вы подтверждаете бронирование {selectedSeats.length} мест?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }} color="#d32f2f">
            Важно: оплата производится в кассе театра не позднее чем за 1 час до начала сеанса.
          </DialogContentText>
          <Box sx={{ mt: 2, maxHeight: '200px', overflow: 'auto' }}>
            {selectedSeats.map(seat => {
              const row = rows.find(r => r.ID === seat.rowId);
              const seatNumber = row?.Seats?.find(s => s.ID === seat.seatId)?.SeatNumber;
              return (
                <Typography key={seat.seatId} variant="body2" sx={{ mb: 1 }} color="white">
                  • Ряд {row?.RowNumber}, Место {seatNumber} - {row?.totalPrice} BYN
                </Typography>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} sx={{ color: "#d32f2f" }}>
            Отмена
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            autoFocus
            variant="contained"
            sx={{ backgroundColor: "#d32f2f", "&:hover": { backgroundColor: "#b71c1c" } }}
          >
            Подтвердить бронь
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%', bgcolor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%', bgcolor: '#4CAF50', color: 'white' }}>
          Билет успешно забронирован! Вы будете перенаправлены в профиль.
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default GetTicket;