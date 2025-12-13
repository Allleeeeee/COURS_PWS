import { useEffect, useState, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import {
  Box, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Select, MenuItem, Divider, Avatar, FormControl, InputLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CalendarToday, Theaters, Search } from "@mui/icons-material";
import ManagerHeader from "../ManagerHeader";

const SeancePage = observer(() => {
  const { store } = useContext(Context);
  const [seances, setSeances] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [date, setDate] = useState("");
  //const [theatreId, setTheatreId] = useState("");
  const [managerTheatre, setManagerTheatre] = useState(null);
  const navigate = useNavigate();

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
      color: 'white'
    },
    '& .MuiInputLabel-root': { 
      color: '#aaa',
      '&.Mui-focused': { color: '#d32f2f' }
    },
    '& .MuiSelect-icon': { color: '#aaa' }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const managerTheatre = await store.getTheatreByManager(store.user.id);
        setManagerTheatre(managerTheatre);

        const [all, th, sh] = await Promise.all([
          store.getSeances(),
          store.getTheatres(),
          store.getShows()
        ]);
        const filteredSeances = all.filter(s => s.Theatre_id === managerTheatre.ID);
        setSeances(filteredSeances);
        //setTheatres(th);
        setShows(sh);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      }
    };
    fetchInitialData();
  }, [store]);


  const filteredSeances = useMemo(() => {
    return seances.filter(seance => {
      let dateMatch = true;
      if (date) {
        const seanceDate = new Date(seance.Start_time).toISOString().split('T')[0];
        dateMatch = seanceDate === date;
      }
      
      return dateMatch;
    });
  }, [seances, date]);

  const getTheatreName = (id) => theatres.find(t => t.ID === id)?.ThName || id;
  const getShowTitle = (id) => shows.find(s => s.ID === id)?.Title || id;

  return (
    <>
      <ManagerHeader/>
      <Paper elevation={3} sx={{ 
        p: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        mx: 'auto',
        mt: 4,
        maxWidth: 1200
      }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
            <CalendarToday />
          </Avatar>
          <Typography variant="h4" sx={{ color: 'white' }}>
          Управление сеансами {managerTheatre && `(${managerTheatre.ThName})`}
        </Typography>
        </Box>

        <Divider sx={{ bgcolor: '#444', mb: 3 }} />

        <Grid container spacing={3} mb={4}>
         
          <Grid item xs={12} sm={5}>
            <TextField
              type="date"
              fullWidth
              label="Дата"
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              sx={inputStyles}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => {
           
                setDate("");
              }}
              sx={{
                height: '56px',
                backgroundColor: '#333',
                '&:hover': { backgroundColor: '#444' }
              }}
            >
              Сбросить
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ backgroundColor: '#333' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#2a2a2a' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Театр</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Шоу</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Начало</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Конец</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Статус</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSeances.map((s) => (
                <TableRow key={s.ID} hover sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}>
                  <TableCell sx={{ color: 'white' }}>{getTheatreName(s.Theatre_id)}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{getShowTitle(s.Show_id)}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{new Date(s.Start_time).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{new Date(s.End_time).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{s.Status}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/seance/${s.ID}`)}
                      sx={{ 
                        color: '#d32f2f', 
                        borderColor: '#d32f2f',
                        '&:hover': { borderColor: '#b71c1c' }
                      }}
                    >
                      Подробнее
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
});

export default SeancePage;