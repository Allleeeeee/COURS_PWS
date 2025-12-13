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

const AddSector = observer(({ theatres, selectedTheatreId, onSectorChange }) => {
  const { store } = useContext(Context);

  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [placeCount, setPlaceCount] = useState("");
  const [priceMarkUp, setPriceMarkUp] = useState("");
  const [theatreId, setTheatreId] = useState(selectedTheatreId || "");
  const [maxRows, setMaxRows] = useState(15);
  const [maxPlaces, setMaxPlaces] = useState(30);
  const [lastRowNumber, setLastRowNumber] = useState(0);
  const [availableRows, setAvailableRows] = useState(0);

  const [sucMessage, setSucMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (selectedTheatreId) {
      setTheatreId(selectedTheatreId);
    }
  }, [selectedTheatreId]);

  useEffect(() => {
    if (theatreId && type) {
      store.getLastRow(theatreId, type)
        .then(lastRow => {
          const lastRowNum = lastRow || 0;
          setLastRowNumber(lastRowNum);
          setFrom((lastRowNum + 1).toString());
          
          // Устанавливаем ограничения в зависимости от типа сектора
          let maxR, maxP;
          switch(type) {
            case "Ложа бельэтажа левая":
            case "Ложа бельэтажа правая":
            case "Ложа балкона левая":
            case "Ложа балкона правая":
              maxR = 5;
              maxP = 8;
              break;
            case "Балкон":
              maxR = 5;
              maxP = 15;
              break;
            default: // Партер, Амфитеатр, Бельэтаж
              maxR = 15;
              maxP = 30;
          }
          
          setMaxRows(maxR);
          setMaxPlaces(maxP);
          // Доступные ряды = максимальное количество - последний добавленный ряд
          setAvailableRows(maxR - lastRowNum);
        })
        .catch(err => {
          console.error("Ошибка при получении последнего ряда:", err);
          setLastRowNumber(0);
          setFrom("1");
          setAvailableRows(maxRows);
        });
    }
  }, [theatreId, type, store]);

  const handleAddSector = async () => {
    setErrorMessage("");
    setSucMessage("");

    const rowsToAdd = parseInt(to) - parseInt(from) + 1;
    
    if (rowsToAdd > availableRows) {
      setErrorMessage(`Можно добавить максимум ${availableRows} рядов (всего ${maxRows} для этого типа)`);
      return;
    }

    if (parseInt(placeCount) > maxPlaces) {
      setErrorMessage(`Для этого типа сектора максимальное количество мест: ${maxPlaces}`);
      return;
    }

    try {
      await store.addSectors(theatreId, type, from, to, placeCount, priceMarkUp);
      onSectorChange();
      setType("");
      setFrom("");
      setTo("");
      setPlaceCount("");
      setPriceMarkUp("");
      setSucMessage("Сектор успешно добавлен!");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Ошибка добавления сектора");
    }
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setTo("");
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#555' },
      '&:hover fieldset': { borderColor: '#d32f2f' },
      '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
      '& .MuiInputBase-input': { color: 'white' }
    },
    '& .MuiInputLabel-root': { 
      color: '#aaa',
      '&.Mui-focused': { color: '#d32f2f' }
    },
    '& .MuiSelect-icon': { color: '#aaa' },
    '& .MuiFormHelperText-root': {
      color: 'white'
    }
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
        Добавить сектор
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, color: 'black' }}>
          {errorMessage}
        </Alert>
      )}
      {sucMessage && (
        <Alert severity="success" sx={{ mb: 2, color: 'black' }}>
          {sucMessage}
        </Alert>
      )}

      <TextField
        fullWidth
        select
        margin="normal"
        label="Театр"
        value={theatreId || ""}
        onChange={(e) => setTheatreId(e.target.value)}
       sx={{
      color: 'white !important',
      '& .Mui-disabled': {
        color: 'white !important',
        WebkitTextFillColor: 'white !important'
      },
      '& .MuiSelect-icon': { color: '#aaa' }
    }}
        disabled={!!selectedTheatreId}
      >
        {theatres.length > 0 ? (
          theatres.map((theatre) => (
            <MenuItem key={theatre.ID} value={theatre.ID} sx={menuItemStyles}>
              <Typography sx={{ color: 'white' }}>{theatre.ThName}</Typography>
            </MenuItem>
          ))
        ) : (
          <MenuItem key="no-theatres" disabled sx={menuItemStyles}>
            <Typography sx={{ color: 'white' }}>Нет доступных театров</Typography>
          </MenuItem>
        )}
      </TextField>

      <TextField 
        fullWidth 
        select 
        margin="normal" 
        label="Тип" 
        value={type || ""} 
        onChange={handleTypeChange}
        sx={inputStyles}
      >
        {["Партер", "Амфитеатр", "Бельэтаж", "Ложа бельэтажа левая", 
          "Ложа бельэтажа правая", "Ложа балкона левая", "Ложа балкона правая", "Балкон"]
          .map(sectorType => (
            <MenuItem key={sectorType} value={sectorType} sx={menuItemStyles}>
              <Typography sx={{ color: 'white' }}>{sectorType}</Typography>
            </MenuItem>
          ))}
      </TextField>

      <TextField 
        fullWidth 
        margin="normal" 
        label="От ряда" 
        type="number" 
        value={from} 
        onChange={(e) => setFrom(e.target.value)}
        sx={inputStyles}
        InputProps={{ 
          inputProps: { 
            min: lastRowNumber + 1,
            max: lastRowNumber + 1,
            readOnly: true 
          } 
        }}
      />
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="До ряда" 
        type="number" 
        value={to} 
        onChange={(e) => setTo(e.target.value)}
        sx={inputStyles}
        InputProps={{ 
          inputProps: { 
            min: lastRowNumber + 1,
            max: lastRowNumber + availableRows
          } 
        }}
        helperText={`Можно добавить ряды с ${lastRowNumber + 1} по ${lastRowNumber + availableRows} (всего ${maxRows} для этого типа)`}
      />
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="Количество мест" 
        type="number" 
        value={placeCount} 
        onChange={(e) => setPlaceCount(e.target.value)}
        sx={inputStyles}
        InputProps={{ 
          inputProps: { 
            min: 1,
            max: maxPlaces
          } 
        }}
        helperText={`Максимум: ${maxPlaces} мест`}
      />

      <FormControl fullWidth margin="normal" sx={inputStyles}>
        <InputLabel sx={{ color: '#aaa' }}>Наценка</InputLabel>
        <Select
          value={priceMarkUp}
          onChange={(e) => setPriceMarkUp(e.target.value)}
          label="Наценка"
        >
          {[5, 10, 12, 15, 17, 20, 25, 30, 35].map(value => (
            <MenuItem key={value} value={value} sx={menuItemStyles}>
              <Typography sx={{ color: 'white' }}>{value} BYN</Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button 
        fullWidth 
        variant="contained" 
        onClick={handleAddSector}
        disabled={!theatreId || !type || !from || !to || !placeCount || !priceMarkUp}
        sx={{
          mt: 3,
          py: 1.5,
          backgroundColor: '#d32f2f',
          '&:hover': { backgroundColor: '#b71c1c' },
          '&:disabled': { backgroundColor: '#555', color: '#888' }
        }}
      >
        Добавить сектор
      </Button>
    </Paper>
  );
});

export default AddSector;