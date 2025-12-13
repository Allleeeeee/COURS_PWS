import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Divider, 
  Chip,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CircularProgress,
  Stack
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { Search, AccountCircle, TheaterComedy } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Context } from '../../..';
import './page-styles/ActorPage.css';
import { getYandexDiskFileUrl } from '../../manager/yandex/disk';
import Header from '../components/Header';

const ActorPage = observer(() => {
  const { id } = useParams();
  const { store } = useContext(Context);
  const [actor, setActor] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActorData = async () => {
      try {
        setLoading(true);
        
        const allCast = await store.getCast();
        const foundActor = allCast.find(a => a.Cast_id.toString() === id);
        console.log(foundActor.Photo);
        if (foundActor) {
          let actorWithPhoto = { ...foundActor };
          if (foundActor.Photo) {
            try {
              const filePath = foundActor.Photo.replace("https://webdav.yandex.ru", "");
              const photoUrl = await getYandexDiskFileUrl(filePath);
              actorWithPhoto = { ...foundActor, photoUrl };
            } catch (error) {
              console.error('Ошибка загрузки аватарки актера:', error);
            }
          }
          setActor(actorWithPhoto);

          const showsData = await store.getShowsByActorId(id);
          
          const showsWithPosters = await Promise.all(
            showsData.map(async show => {
              if (show.Poster) {
                try {
                  const filePath = show.Poster.replace("https://webdav.yandex.ru", "");
                  const posterUrl = await getYandexDiskFileUrl(filePath);
                  return { ...show, posterUrl };
                } catch (error) {
                  console.error(`Ошибка загрузки постера для шоу ${show.ID}:`, error);
                  return { ...show, posterUrl: null };
                }
              }
              return show;
            })
          );
          
          setShows(showsWithPosters);
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActorData();
  }, [id, store]);

  if (loading) return <div className="loading">
     <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress sx={{ color: '#d32f2f' }} />
            </Box>
  </div>;
  if (!actor) return <div className="not-found">Актер не найден</div>;

  return (
    <>
    <Header/>
    <Box className="actor-container" sx={{ maxWidth: 1500, margin: '0 auto', p: 3 }}>
      <Button 
        startIcon={<ArrowLeft />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, color: '#d32f2f', fontSize:'1rem' }}
      >
        Назад
      </Button>

      <Box className="actor-header" sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4 }}>
        <Avatar 
          src={actor.photoUrl || "/default-avatar.jpg"}
          alt={`${actor.Name} ${actor.Surname}`}
          sx={{ width: 150, height: 150, boxShadow: 3 }}
        />
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            {actor.Name} {actor.Surname}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3, bgcolor: 'divider' }} />

      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        Описание
      </Typography>
      <Typography paragraph sx={{ lineHeight: 1.8, fontSize: '1.3rem' }}>
        {actor.Description || 'Информация отсутствует'}
      </Typography>

      <Typography variant="h5" component="h2" sx={{ mt: 6, mb: 3, fontWeight: 600 }}>
        Участие в спектаклях
      </Typography>
      
      {shows.length > 0 ? (
        <Grid container spacing={3}>
          {shows.map(show => (
            <Grid item xs={12} sm={6} md={4} key={show.ID}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'rgba(30, 30, 30, 0.8)', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  border: '1px solid',
                  borderColor: '#444',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
                    borderColor: '#d32f2f'
                  }
                }}
                
              >
                {show.posterUrl && (
                  <CardMedia
                    component="img"
                    height="240"
                    image={show.posterUrl}
                    alt={show.Title}
                    sx={{
                      objectFit: 'cover',
                      bgcolor: 'rgba(30, 30, 30, 0.8)', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                )}
                <CardContent sx={{ 
                  flexGrow: 1,
                  p: 3,
                  bgcolor: 'rgba(30, 30, 30, 0.8)', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.9)',
                      mb: 2,
                      fontSize:'1.5rem'
                    }}
                  >
                    {show.Title}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={show.Genre} 
                      size="small" 
                      sx={{
                        bgcolor: '#d32f2f',
                        color: 'white',
                        fontWeight: 500,
                        fontSize:'1.3rem'
                      }}
                    />
                    {show.ShowCasts?.Role && (
                      <Chip 
                        label={`Роль: ${show.ShowCasts.Role}`} 
                        size="small" 
                        variant="outlined"
                        sx={{
                          borderColor: '#d32f2f',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 500,
                          fontSize:'1.3rem'
                        }}
                      />
                    )}
                    {show.Rating && (
                      <Chip 
                        label={`★ ${show.Rating}`} 
                        size="small"
                        sx={{
                          bgcolor: '#d32f2f',
                          color: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 500,
                          fontSize:'1.3rem'
                        }}
                      />
                    )}
                  </Stack>
                  
                  <Typography 
                 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}
                  >
                    {show.Description?.substring(0, 100)}...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          my: 4,
          border: '2px dashed',
          borderColor: '#d32f2f',
          borderRadius: 2,
          bgcolor: 'background.paper',
          textAlign: 'center'
        }}>
          <TheaterComedy 
            sx={{ 
              fontSize: 48,
              color: '#d32f2f',
              opacity: 0.7,
              mb: 2
            }} 
          />
          <Typography 
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              mb: 1
            }}
          >
            Нет информации о спектаклях
          </Typography>
          <Typography 
            variant="body2"
            sx={{
              color: 'text.disabled',
              maxWidth: 400
            }}
          >
            У этого актера пока нет запланированных спектаклей
          </Typography>
        </Box>
      )}
    </Box>
    </>
  );
});

export default ActorPage;