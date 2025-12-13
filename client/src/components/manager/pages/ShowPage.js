import { useState, useEffect, useContext } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import ShowCard from "../ShowCard";
import ManagerHeader from "../ManagerHeader";
import { 
  Grid, 
  Typography, 
  CircularProgress, 
  Paper,
  Box,
  Avatar
} from "@mui/material";
import { TheaterComedy } from "@mui/icons-material";

const ShowPage = observer(() => {
  const { store } = useContext(Context);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const data = await store.getShowsByManager(store.user.id);
        setShows(data);
      } catch (err) {
        console.error("Ошибка загрузки шоу:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [store]);

  return (
    <>
    <ManagerHeader/>
    <Paper elevation={3} sx={{ 
      p: 4,
      backgroundColor: '#2a2a2a',
      borderRadius: 2,
      minHeight: '100vh'
    }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ 
          bgcolor: '#d32f2f',
          width: 56,
          height: 56,
          mr: 2
        }}>
          <TheaterComedy fontSize="large" />
        </Avatar>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          Все постановки
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: '#d32f2f' }} />
        </Box>
      ) : shows.length > 0 ? (
        <Grid container spacing={3}>
          {shows.map((show) => (
            <Grid item key={show.ID} xs={12} sm={6} md={4} lg={3}>
              <ShowCard show={show} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6" sx={{ color: '#aaa', textAlign: 'center' }}>
          Нет доступных постановок
        </Typography>
      )}
    </Paper>
    </>
  );
});

export default ShowPage;