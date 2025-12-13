import React, { useEffect, useRef, useState } from 'react';
import useYandexMaps from './useYandexMaps';

const YandexMap = ({ coordinates, address, width = '100%', height = '400px' }) => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useYandexMaps('6538d88b-34e9-4ca9-b1f7-73fb99ada4ec', () => {
    setMapInitialized(true);
  });

  useEffect(() => {
    if (!mapInitialized || !window.ymaps || !mapContainerRef.current) return;

    // Сохраняем ссылку на DOM-элемент в переменную
    const mapContainer = mapContainerRef.current;
    let map = null;

    const initMap = () => {
      if (mapContainer._yandexMap) {
        mapContainer._yandexMap.destroy();
      }

      map = new window.ymaps.Map(mapContainer, {
        center: coordinates || [55.76, 37.64],
        zoom: coordinates ? 15 : 12,
        controls: ['zoomControl']
      });

      mapContainer._yandexMap = map;

      if (coordinates) {
        const placemark = new window.ymaps.Placemark(
          coordinates,
          {
            hintContent: address,
            balloonContent: address
          },
          {
            preset: 'islands#redIcon'
          }
        );
        map.geoObjects.add(placemark);
      }
    };

    initMap();

    return () => {
      // Используем сохранённую ссылку на mapContainer
      if (mapContainer._yandexMap) {
        mapContainer._yandexMap.destroy();
        delete mapContainer._yandexMap;
      }
    };
  }, [coordinates, address, mapInitialized]);

  return <div ref={mapContainerRef} style={{ width, height, margin: '20px 0', border: '2px solid #d32f2f' }} />;
};

export default YandexMap;