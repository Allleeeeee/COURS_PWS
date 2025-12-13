import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box,
  Chip
} from "@mui/material";
import { getYandexDiskFileUrl } from './yandex/disk';
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../..";
import { observer } from "mobx-react-lite";

const ShowCard = observer(({ show }) => {
  const { store } = useContext(Context);
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState("");
  const [theatreName, setTheatreName] = useState("");

  useEffect(() => {
    const fetchImage = async () => {
      if (show.Poster) {
        const filePath = show.Poster.replace("https://webdav.yandex.ru", "");
        const url = await getYandexDiskFileUrl(filePath);
        setImageUrl(url);
      }
    };

    const fetchTheatre = async () => {
      try {
        const theatres = await store.getTheatres();
        const theatre = theatres.find(t => t.ID === show.Theatre_id);
        if (theatre) setTheatreName(theatre.ThName);
      } catch (err) {
        console.error("Ошибка загрузки театров:", err);
      }
    };

    fetchImage();
    fetchTheatre();
  }, [show.Poster, show.Theatre_id, store]);

  const handleClick = () => {
    navigate(`/allShows/${show.ID}`);
  };

  return (
    <Card 
      onClick={handleClick}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#333',
        color: 'white',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          border: '1px solid #d32f2f'
        }
      }}
    >
      {imageUrl && (
        <CardMedia
          component="img"
          height="300"
          image={imageUrl}
          alt={show.Title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ mb: 1, color: 'white' }}>
          {show.Title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={show.Genre} 
            size="small" 
            sx={{ 
              backgroundColor: '#d32f2f',
              color: 'white',
              mr: 1
            }} 
          />
        </Box>
        
        <Typography variant="body2" sx={{ mb: 1, color: '#aaa' }}>
          🎭 Театр: {theatreName || "Неизвестно"}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#ddd',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {show.Description}
        </Typography>
      </CardContent>
    </Card>
  );
});

export default ShowCard;