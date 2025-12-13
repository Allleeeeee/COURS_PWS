import React, { useState, useEffect, useContext } from 'react';
import { 
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Grid,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  ConfirmationNumber as TicketIcon
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { Context } from "../../..";
import ManagerHeader from '../ManagerHeader';

const TicketsInfo = observer(() => {
  const { store } = useContext(Context);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [seanceIdFilter, setSeanceIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const Theatre = await store.getTheatreByManager(store.user.id);
        console.log(Theatre.ID);
        const data = await store.getTicketsWithDetailsByTh(Theatre.ID);
        setTickets(data);
        setFilteredTickets(data);
      } catch (error) {
        console.error('Ошибка при загрузке билетов:', error);
      }
    };
    fetchTickets();
  }, [store]);

  useEffect(() => {
    applyFilters();
  }, [userIdFilter, seanceIdFilter, dateFilter, tickets]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const applyFilters = () => {
    let result = [...tickets];

    if (userIdFilter) {
      result = result.filter(ticket => 
        String(ticket.user.id).includes(userIdFilter));
    }

    if (seanceIdFilter) {
      result = result.filter(ticket => 
        String(ticket.seance.id).includes(seanceIdFilter));
    }

    if (dateFilter) {
      result = result.filter(ticket => {
        const seanceDate = new Date(ticket.seance.startTime).toISOString().split('T')[0];
        return seanceDate === dateFilter;
      });
    }

    setFilteredTickets(result);
  };

  const clearFilters = () => {
    setUserIdFilter('');
    setSeanceIdFilter('');
    setDateFilter('');
    setFilteredTickets(tickets);
  };

  return (
    <>
      <ManagerHeader/>
      <Box sx={{ 
        p: 3, 
        bgcolor: '#1e1e1e', 
        minHeight: '100vh',
        color: 'white'
      }}>
        <Paper elevation={3} sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#2a2a2a',
          color: 'white'
        }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            <TicketIcon sx={{ mr: 1, verticalAlign: 'middle', color:'#ff5252' }} />
            Все бронирования
          </Typography>
          <Divider sx={{ bgcolor: '#444', mb: 3 }} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Поиск по ID пользователя"
                variant="outlined"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#ff5252' }} />
                    </InputAdornment>
                  ),
                  sx: { 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { color: '#aaa' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Поиск по ID сеанса"
                variant="outlined"
                value={seanceIdFilter}
                onChange={(e) => setSeanceIdFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#ff5252' }} />
                    </InputAdornment>
                  ),
                  sx: { 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { color: '#aaa' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Фильтр по дате"
                variant="outlined"
                InputLabelProps={{ shrink: true,  sx: { color: 'white' } }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" >
                      <DateRangeIcon sx={{ color: '#ff5252' }} />
                    </InputAdornment>
                  ),
                  sx: { 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          <Button 
            variant="outlined" 
            onClick={clearFilters}
            sx={{ 
              color: '#ff5252', 
              borderColor: '#ff5252',
              mb: 3,
              '&:hover': {
                borderColor: '#ff5252',
                bgcolor: 'rgba(255, 82, 82, 0.08)'
              }
            }}
          >
            Сбросить фильтры
          </Button>

          <TableContainer component={Paper} sx={{ bgcolor: '#2a2a2a' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#333' }}>
                  <TableCell sx={{ color: 'white' }}>ID билета</TableCell>
                  <TableCell sx={{ color: 'white' }}>Статус</TableCell>
                  <TableCell sx={{ color: 'white' }}>Пользователь</TableCell>
                  <TableCell sx={{ color: 'white' }}>Театр</TableCell>
                  <TableCell sx={{ color: 'white' }}>Спектакль</TableCell>
                  <TableCell sx={{ color: 'white' }}>Ряд</TableCell>
                  <TableCell sx={{ color: 'white' }}>Место</TableCell>
                  <TableCell sx={{ color: 'white' }}>Сеанс</TableCell>
                  <TableCell sx={{ color: 'white' }}>Информация</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover sx={{ '&:hover': { bgcolor: '#333' } }}>
                    <TableCell sx={{ color: 'white' }}>{ticket.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        color={ticket.status === 'Активно' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {ticket.user.name} {ticket.user.surname}
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        ID: {ticket.user.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>{ticket.theatre.name}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{ticket.show.title}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {ticket.row.number} 
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        ({ticket.row.type})
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>{ticket.seat.number}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Stack>
                        <Typography>ID: {ticket.seance.id}</Typography>
                        <Typography>
                          {formatDate(ticket.seance.startTime)}
                        </Typography>
                        <Typography sx={{ color: '#aaa' }}>
                          до {formatTime(ticket.seance.endTime)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Stack>
                        <Typography>Цена: {ticket.ticketInfo.totalPrice}</Typography>
                        <Chip 
                          label={ticket.ticketInfo.seatStatus} 
                          color={ticket.ticketInfo.seatStatus === 'Свободно' ? 'success' : 'error'}
                          size="small"
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
});

export default TicketsInfo;