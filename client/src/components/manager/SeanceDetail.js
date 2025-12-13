import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { observer } from "mobx-react-lite";
import {
  Box, TextField, Button, Typography, Alert, Paper,
  FormControl, InputLabel, Select, MenuItem, Divider, Avatar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import { Context } from "../..";
import { Theaters, Edit, Delete } from "@mui/icons-material";
import ManagerHeader from "./ManagerHeader";

const SeanceDetail = observer(() => {
  const { store } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();

  const [seance, setSeance] = useState(null);
  const [theatres, setTheatres] = useState(null);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

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

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seanceData, theatresData] = await Promise.all([
          store.getSeanceById(id),
          store.getTheatreByManager(store.user.id)
        ]);
        console.log("Theatre data:", theatresData); // Добавьте это для отладки
        setSeance(seanceData);
        setTheatres(theatresData);
      } catch (err) {
        setError("Не удалось загрузить данные");
        console.error("Error fetching data:", err); // И это
      }
    };
    fetchData();
  }, [id, store]);

  useEffect(() => {
    const fetchShows = async () => {
      if (!seance?.Theatre_id) return;
      try {
        const filteredShows = await store.getShowsByTheatre(seance.Theatre_id);
        setShows(filteredShows);
      } catch (err) {
        console.error("Ошибка загрузки шоу:", err);
      }
    };
    fetchShows();
  }, [seance?.Theatre_id, store]);

  const handleUpdate = async () => {
    try {
      await store.updateSeance(
        seance.ID,
        store.user.id,
        seance.Theatre_id,
        seance.Show_id,
        seance.Start_time,
        seance.End_time,
        seance.Status
      );
      navigate("/seances");
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка обновления");
    }
  };

  const handleDelete = async () => {
    try {
      await store.deleteSeance(seance.ID, store.user.id);
      navigate("/seances");
    } catch (err) {
      setError("Ошибка удаления");
    }
  };

  const handleCancelSeance = async () => {
    try {
      await store.canselSeance(seance.ID, store.user.id);
      navigate("/seances");
    } catch (err) {
      setError("Ошибка отмены сеанса");
    }
    setOpenDialog(false);
  };
  // const handleDeleteSeance = async ()=>{
  //   try{
  //     await store.deleteSeance(seance.ID);
  //     navigate("/seances");
  //   }catch(err){
  //     setError("Ошибка удаления сеанса");
  //   }
  // };

  if (!seance) return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Typography variant="h6" color="white">Загрузка...</Typography>
    </Box>
  );

  return (
    <>
      <ManagerHeader/>
      <Paper elevation={3} sx={{ 
        p: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        maxWidth: 800,
        mx: 'auto',
        mt: 4
      }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
            <Theaters />
          </Avatar>
          <Typography variant="h4" sx={{ color: 'white' }}>
            Редактировать сеанс #{seance.ID}
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: '#444', mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box display="flex" flexDirection="column" gap={3}>
        <TextField
  fullWidth
  label="Театр"
  value={theatres ? theatres.ThName : "Загрузка..."}
  InputProps={{
    readOnly: true,
  }}
  sx={inputStyles}
/>

          <FormControl fullWidth sx={inputStyles}>
            <InputLabel>Постановка</InputLabel>
            <Select
              value={seance.Show_id}
              onChange={(e) => setSeance({...seance, Show_id: e.target.value})}
              label="Постановка"
            >
              {shows.map((s) => (
                <MenuItem key={s.ID} value={s.ID} sx={{ color: 'white' }}>
                  {s.Title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Начало"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formatDateForInput(seance.Start_time)}
            onChange={(e) => setSeance({...seance, Start_time: e.target.value})}
            sx={inputStyles}
          />

          <TextField
            fullWidth
            label="Конец"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={formatDateForInput(seance.End_time)}
            onChange={(e) => setSeance({...seance, End_time: e.target.value})}
            sx={inputStyles}
          />

          <TextField
            fullWidth
            label="Статус"
            value={seance.Status}
            onChange={(e) => setSeance({...seance, Status: e.target.value})}
            sx={inputStyles}
          />

          <Box display="flex" gap={2} mt={2}>
            <Button 
              variant="contained" 
              onClick={handleUpdate}
              startIcon={<Edit />}
              sx={{
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' }
              }}
            >
              Обновить
            </Button>
            
            {seance.Status === "Проведён" ? (
              <Button 
                variant="outlined" 
                onClick={handleDelete}
                startIcon={<Delete />}
                sx={{ 
                  color: '#d32f2f', 
                  borderColor: '#d32f2f',
                  '&:hover': { borderColor: '#b71c1c' }
                }}
              >
                Удалить
              </Button>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  onClick={() => setOpenDialog(true)}
                  startIcon={<Delete />}
                  sx={{ 
                    color: '#d32f2f', 
                    borderColor: '#d32f2f',
                    '&:hover': { borderColor: '#b71c1c' }
                  }}
                >
                  Отменить
                </Button>
                
                <Dialog
                  open={openDialog}
                  onClose={() => setOpenDialog(false)}
                  PaperProps={{ sx: { bgcolor: '#2a2a2a', color: 'white' } }}
                >
                  <DialogTitle>Подтверждение отмены</DialogTitle>
                  <DialogContent>
                    <DialogContentText sx={{ color: '#aaa' }}>
                      Вы точно хотите отменить не проведённый сеанс?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button 
                      onClick={() => setOpenDialog(false)}
                      sx={{ color: '#aaa' }}
                    >
                      Нет
                    </Button>
                    <Button 
                      onClick={handleCancelSeance}
                      sx={{ color: '#d32f2f' }}
                    >
                      Да, отменить
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </>
  );
});

export default SeanceDetail;