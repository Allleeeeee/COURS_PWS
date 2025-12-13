import { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { 
  TextField, 
  Button, 
  MenuItem, 
  Typography, 
  Box, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select,
  Paper
} from "@mui/material";
import { Context } from "../..";

const DeleteSector = observer(({ theatres, selectedTheatreId, onSectorChange }) => {
  const { store } = useContext(Context);

  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [theatreId, setTheatreId] = useState(selectedTheatreId || "");

  const [sucMessage, setSucMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (selectedTheatreId) {
      setTheatreId(selectedTheatreId);
    }
  }, [selectedTheatreId]);

  const handleDelSector = async () => {
    setErrorMessage("");
    setSucMessage("");

    try {
      await store.deleteSectors(theatreId, type, from, to);
      onSectorChange();
      setType("");
      setFrom("");
      setTo("");
      setSucMessage("Сектор успешно удалён!");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Ошибка удаления сектора");
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' }
    },
    '& .MuiInputLabel-root': { 
      color: '#aaa',
      '&.Mui-focused': { color: '#d32f2f' }
    },
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiSelect-icon': { color: '#aaa' }
  };

  const menuItemStyles = {
    color: 'white',
    backgroundColor: '#2a2a2a',
    '&:hover': { backgroundColor: '#333' },
    '&.Mui-selected': { backgroundColor: '#d32f2f' }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4,
      backgroundColor: '#2a2a2a',
      borderRadius: 2,
      height: '100%'
    }}>
      <Typography variant="h5" sx={{ 
        color: 'white',
        mb: 3,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Удалить сектор
      </Typography>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {sucMessage && <Alert severity="success" sx={{ mb: 2 }}>{sucMessage}</Alert>}

      <TextField
        fullWidth
        select
        margin="normal"
        label="Выберите театр"
        value={theatreId || ""}
        onChange={(e) => setTheatreId(e.target.value)}
        sx={inputStyles}
        disabled={!!selectedTheatreId}
      >
        {theatres.length > 0 ? (
          theatres.map((theatre) => (
            <MenuItem key={theatre.ID} value={theatre.ID} sx={menuItemStyles}>
              {theatre.ThName}
            </MenuItem>
          ))
        ) : (
          <MenuItem key="no-theatres" disabled sx={menuItemStyles}>
            Нет доступных театров
          </MenuItem>
        )}
      </TextField>

      <TextField 
        fullWidth 
        select 
        margin="normal" 
        label="Тип" 
        value={type || ""} 
        onChange={(e) => setType(e.target.value)}
        sx={inputStyles}
      >
        <MenuItem value="Партер" sx={menuItemStyles}>Партер</MenuItem>
        <MenuItem value="Амфитеатр" sx={menuItemStyles}>Амфитеатр</MenuItem>
        <MenuItem value="Бельэтаж" sx={menuItemStyles}>Бельэтаж</MenuItem>
        <MenuItem value="Ложа бельэтажа левая" sx={menuItemStyles}>Ложа бельэтажа левая</MenuItem>
        <MenuItem value="Ложа бельэтажа правая" sx={menuItemStyles}>Ложа бельэтажа правая</MenuItem>
        <MenuItem value="Ложа балкона левая" sx={menuItemStyles}>Ложа балкона левая</MenuItem>
        <MenuItem value="Ложа балкона правая" sx={menuItemStyles}>Ложа балкона правая</MenuItem>
        <MenuItem value="Балкон" sx={menuItemStyles}>Балкон</MenuItem>
      </TextField>

      <TextField 
        fullWidth 
        margin="normal" 
        label="От ряда" 
        type="number" 
        value={from} 
        onChange={(e) => setFrom(e.target.value)}
        sx={inputStyles}
        InputProps={{ inputProps: { min: 1 } }}
      />
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="До ряда" 
        type="number" 
        value={to} 
        onChange={(e) => setTo(e.target.value)}
        sx={inputStyles}
        InputProps={{ inputProps: { min: 1 } }}
      />
      
      <Button 
        fullWidth 
        variant="contained" 
        onClick={handleDelSector}
        disabled={!theatreId || !type || !from || !to}
        sx={{
          mt: 3,
          py: 1.5,
          backgroundColor: '#d32f2f',
          '&:hover': { backgroundColor: '#b71c1c' },
          '&:disabled': { backgroundColor: '#555', color: '#888' }
        }}
      >
        Удалить сектор
      </Button>
    </Paper>
  );
});

export default DeleteSector;