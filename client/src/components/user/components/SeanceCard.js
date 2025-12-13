import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { 
  Paid      
} from '@mui/icons-material';
import { observer } from "mobx-react-lite";
import { getYandexDiskFileUrl } from "../../manager/yandex/disk";
import { Context } from "../../..";
import "./styles/SeanceCard.css";

const SeanceCard = observer(({ seance }) => {
  const { store } = useContext(Context);
  const [imageUrl, setImageUrl] = useState("");
  const navigate = useNavigate();
  const [minPrice, setMinPrice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      if (seance.show.poster) {
        const filePath = seance.show.poster.replace("https://webdav.yandex.ru", "");
        const url = await getYandexDiskFileUrl(filePath);
        setImageUrl(url);
      }
    };
    fetchImage();
  }, [seance.show.poster]);

  useEffect(()=>{
    const fetchMinPrice = async () =>{
      try{
      if(seance.show.start_price){
        const min = await store.getMinPrice(seance.id);
        const min_start = Number(seance.show.start_price) + Number(min);
        setMinPrice(min_start);
      }
      }catch(error){
        console.error("Ошибка при загрузке сеанса:", error);
      }
    }; fetchMinPrice();
  }, [seance.id, store, seance?.show?.start_price])

  const handleClick = () => {
    navigate(`/seance/${seance.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="seance-card" elevation={6}>
      <div className="seance-card-inner" style={{ position: 'relative' }}>
      {isLoading && (
      <Box 
        sx={{
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a'
        }}
      >
        {/* Круговой индикатор загрузки */}
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
   <CardMedia
      component="img"
      height="280"
      image={imageUrl}
      alt={seance.show.title}
      className="seance-img"
      onLoad={() => setIsLoading(false)}
      onError={() => setIsLoading(false)}
      style={{ display: isLoading ? 'none' : 'block' }}
    />
    <div className="overlay">
      <button
        className="book-btn"
        onClick={handleClick}
      >
        Забронировать
      </button>
    </div>
  </div>
      
      <CardContent className="card-content">
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: "white" }}>
          {seance.show.title}
        </Typography>
        <Box display="flex" alignItems="center">
        <Paid 
    sx={{ 
      fontSize: 20, 
      color: '#d32f2f', 
      mr: 1 
    }} 
  />
          <Typography className="data-text">От {minPrice} BYN</Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <CalendarDays size={20} color="#d32f2f" style={{ marginRight: 8 }} />
          <Typography className="data-text">
            {formatDate(seance.startTime)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <MapPin size={20} color="#d32f2f" style={{ marginRight: 8 }} />
          <Typography className="data-text">{seance.show.theatre.name}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

export default SeanceCard;