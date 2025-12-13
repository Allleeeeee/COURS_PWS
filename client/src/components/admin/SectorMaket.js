import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Context } from "../..";

const leftBoxes = ["Ложа балкона левая", "Ложа бельэтажа левая"];
const rightBoxes = ["Ложа балкона правая", "Ложа бельэтажа правая"];

const priceColors = {
  5: "lightblue",
  10: "blue",
  12: "darkgreen",
  15: "purple",
  17: "orange",
  20: "gold",
  25: "brown",
  30: "pink",
  35: "vine",
};

const SectorMaket = observer(({ theatreId }) => {
  const { store } = useContext(Context);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const fetchedRows = await store.getRowsByTheatre(theatreId);
        setRows(fetchedRows);
      } catch (error) {
        console.error("Ошибка загрузки рядов:", error);
      }
    };

    fetchRows();
  }, [theatreId, store]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={3}>
      <Typography variant="h6" sx={{ color: "white" }}>
        Схема зала
      </Typography>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        border="1px solid white"
        p={2}
        width="80vw"
        justifyContent="center"
        overflow="auto"
        
      >
        {/* Левая боковая часть (Ложи слева) */}
        <Box display="flex" flexDirection="column" alignItems="flex-end" pr={2}>
          {leftBoxes.map((type) => (
            <Box
              key={type}
              display="flex"
              flexDirection="column"
              alignItems="center"
              my={1}
            >
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                {type}
              </Typography>
              {rows
                .filter((row) => row.RowType === type)
                .sort((a, b) => b.RowNumber - a.RowNumber)
                .map((row) => (
                  <Box
                    key={row.ID}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Typography variant="body2" mr={1} sx={{ color: "white" }}>
                      {row.RowNumber}:
                    </Typography>
                    {row.Seats?.map((seat) => {
                      const priceKey = Number(row.PriceMarkUp);
                      const color = priceColors[priceKey] || "black";
                      return (
                        <Tooltip
                          key={seat.ID}
                          title={`${row.PriceMarkUp} BYN`}
                          arrow
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                          >
                            <Box
                              width={20}
                              height={20}
                              borderRadius="50%"
                              bgcolor={color}
                            />
                            <Typography variant="caption" sx={{ color: "white" }}>
                              {seat.SeatNumber}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
            </Box>
          ))}
        </Box>

        {/* Центральная часть зала */}
        <Box display="flex" flexDirection="column" alignItems="center" mx={2}>
          {["Балкон", "Партер", "Амфитеатр", "Бельэтаж"]
            .sort((a, b) => b.RowNumber - a.RowNumber)
            .map((type) => (
              <Box
                key={type}
                display="flex"
                flexDirection="column"
                alignItems="center"
                my={2}
              >
                <Typography variant="subtitle1" sx={{ color: "white" }}>
                  {type}
                </Typography>
                {rows
                  .filter((row) => row.RowType === type)
                  .sort((a, b) => b.RowNumber - a.RowNumber)
                  .map((row) => (
                    <Box
                      key={row.ID}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      gap={1}
                      flexWrap="wrap"
                    >
                      <Typography variant="body2" mr={1} sx={{ color: "white" }}>
                        {row.RowNumber}:
                      </Typography>
                      {row.Seats?.map((seat) => {
                        const priceKey = Number(row.PriceMarkUp);
                        const color = priceColors[priceKey] || "black";
                        return (
                          <Tooltip
                            key={seat.ID}
                            title={`${row.PriceMarkUp} BYN`}
                            arrow
                          >
                            <Box
                              display="flex"
                              flexDirection="column"
                              alignItems="center"
                            >
                              <Box
                                width={20}
                                height={20}
                                borderRadius="50%"
                                bgcolor={color}
                              />
                              <Typography variant="caption" sx={{ color: "white" }}>
                                {seat.SeatNumber}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ))}
              </Box>
            ))}

          {/* Сцена */}
          <Box mt={2} display="flex" flexDirection="column" alignItems="center">
            <Box
              width={700}
              height={60}
              bgcolor="gray"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Typography variant="h6" sx={{ color: "white" }}>
                Сцена
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Правая боковая часть (Ложи справа) */}
        <Box display="flex" flexDirection="column" alignItems="flex-start" pl={2}>
          {rightBoxes.map((type) => (
            <Box
              key={type}
              display="flex"
              flexDirection="column"
              alignItems="center"
              my={1}
            >
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                {type}
              </Typography>
              {rows
                .filter((row) => row.RowType === type)
                .sort((a, b) => b.RowNumber - a.RowNumber)
                .map((row) => (
                  <Box
                    key={row.ID}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Typography variant="body2" mr={1} sx={{ color: "white" }}>
                      {row.RowNumber}:
                    </Typography>
                    {row.Seats?.map((seat) => {
                      const priceKey = Number(row.PriceMarkUp);
                      const color = priceColors[priceKey] || "grey";
                      return (
                        <Tooltip
                          key={seat.ID}
                          title={`${row.PriceMarkUp} BYN`}
                          arrow
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                          >
                            <Box
                              width={20}
                              height={20}
                              borderRadius="50%"
                              bgcolor={color}
                            />
                            <Typography variant="caption" sx={{ color: "white" }}>
                              {seat.SeatNumber}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default SectorMaket;