import { useEffect, useRef } from 'react';

const useYandexMaps = (apiKey, callback) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Глобальный флаг для отслеживания состояния загрузки
    if (!window.__YMAPS) {
      window.__YMAPS = { loading: false, loaded: false, callbacks: [] };
    }

    const ymapsState = window.__YMAPS;

    const executeCallback = () => {
      try {
        if (ymapsState.loaded && window.ymaps) {
          callbackRef.current();
        } else {
          ymapsState.callbacks.push(callbackRef.current);
        }
      } catch (e) {
        console.error('Yandex Maps callback error:', e);
      }
    };

    // Если API уже загружено
    if (ymapsState.loaded) {
      setTimeout(executeCallback, 100);
      return;
    }

    // Если API в процессе загрузки
    if (ymapsState.loading) {
      ymapsState.callbacks.push(callbackRef.current);
      return;
    }

    // Начинаем загрузку API
    ymapsState.loading = true;
    
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      if (!window.ymaps) {
        console.error('Yandex Maps API not available after script load');
        return;
      }

      window.ymaps.ready(() => {
        ymapsState.loading = false;
        ymapsState.loaded = true;
        
        // Выполняем все накопленные callback'и
        ymapsState.callbacks.forEach(cb => {
          try {
            cb();
          } catch (e) {
            console.error('Yandex Maps callback error:', e);
          }
        });
        ymapsState.callbacks = [];
      });
    };

    script.onerror = (error) => {
      ymapsState.loading = false;
      console.error('Yandex Maps script load error:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (ymapsState.callbacks.includes(callbackRef.current)) {
        ymapsState.callbacks = ymapsState.callbacks.filter(cb => cb !== callbackRef.current);
      }
    };
  }, [apiKey]);
};

export default useYandexMaps;