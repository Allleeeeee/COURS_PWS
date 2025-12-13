import { useState, useContext, useEffect } from "react";
import { Context } from "..";
import { observer } from "mobx-react-lite";
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Alert,
  IconButton,
  Tabs,
  Tab
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Email, Lock, Person, Badge, ArrowBack } from "@mui/icons-material";

const RegisterPage = observer(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const { store } = useContext(Context);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [surnameError, setSurnameError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeTab, setActiveTab] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegister = async () => {
    setErrorMessage('');
    setEmailError(false);
    setPasswordError(false);
    setNameError(false);
    setSurnameError(false);
  
    let hasError = false;
  
    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError(true);
      hasError = true;
    }
    if (!name.trim()) {
      setNameError(true);
      hasError = true;
    }
    if (!surname.trim()) {
      setSurnameError(true);
      hasError = true;
    }
  
    if (hasError) return; 
    
    try {
      await store.registration(email, password, name, surname);
      navigate("/login");
    } catch (err) {
      console.log(err.response);
      if (err.response.data.message && err.response.data.message !== "Ошибка валидации: ") {
        setErrorMessage(err.response.data.message || "Ошибка регистрации");
      } else if(err.response.data.errors) {
        const errorMess = err.response.data.errors.map(error => error.msg).join('\n');
        setErrorMessage(errorMess);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      navigate("/login");
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: '#121212'
    }}>
      {/* Левая панель с параллаксом */}
      <Box sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box 
          sx={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/Frame82.png)`,
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `translateY(${offset * 0.5}px)`,
            zIndex: 0
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1
          }}
        />
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            color: '#A9A9A9', 
            zIndex: 2,
            fontFamily: '"UnifrakturMaguntia", cursive',
            fontWeight: 400, 
            textShadow: `
              1px 1px 0px #d32f2f,
              3px 3px 0px rgba(0, 0, 0, 0.8),
              5px 5px 10px rgba(0, 0, 0, 0.5)
            `,
            fontSize: { xs: '2.5rem', md: '4rem' },
            letterSpacing: '3px',
            textTransform: 'none', 
            position: 'relative',
            display: 'inline-block',
            mb: 4,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-15px',
              left: '10%',
              width: '80%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #d32f2f, transparent)',
              borderRadius: '50%'
            }
          }}
        >
          Join the Art World
        </Typography>
      </Box>

      {/* Правая панель с формой */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 4,
        backgroundColor: '#1a1a1a',
        position: 'relative'
      }}>
        <IconButton
          onClick={() => navigate("/")}
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            color: '#d32f2f',
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            }
          }}
        >
          <ArrowBack />
        </IconButton>

        <Box sx={{ 
          width: '100%', 
          maxWidth: '450px'
        }}>
          {/* Переключатель Вход/Регистрация */}
          <Box sx={{ 
            mb: 5,
            borderBottom: '1px solid #444'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              centered
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#d32f2f',
                  height: '3px'
                }
              }}
            >
              <Tab 
                label="Вход" 
                sx={{
                  color: activeTab === 0 ? '#fff' : '#aaa',
                  fontFamily: '"Cormorant", serif',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  letterSpacing: '1px',
                  '&.Mui-selected': {
                    color: '#d32f2f'
                  }
                }}
              />
              <Tab 
                label="Регистрация" 
                sx={{
                  color: activeTab === 1 ? '#fff' : '#aaa',
                  fontFamily: '"Cormorant", serif',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  letterSpacing: '1px',
                  '&.Mui-selected': {
                    color: '#d32f2f'
                  }
                }}
              />
            </Tabs>
          </Box>

          <Typography 
            variant="h4"
            sx={{
              color: '#fff',
              fontFamily: '"Cormorant", serif',
              fontWeight: 700,
              fontSize: '2.5rem',
              letterSpacing: '1px',
              textAlign: 'center',
              mb: 5,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-15px',
                left: '25%',
                width: '50%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #d32f2f, transparent)'
              }
            }}
          >
            Регистрация
          </Typography>

          {errorMessage && (
            <Alert 
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                color: '#fff',
                border: '1px solid #d32f2f',
                borderRadius: '4px',
                fontFamily: '"Cormorant", serif',
                fontSize: '1rem'
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3 
            }}>
              <Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={nameError}
                  InputProps={{
                    startAdornment: (
                      <Person sx={{ 
                        color: '#d32f2f',
                        mr: 2
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Cormorant", serif',
                      fontSize: '1.1rem',
                      color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: '#444',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#888',
                      opacity: 1,
                      fontFamily: '"Cormorant", serif',
                      fontSize: '1.1rem'
                    }
                  }}
                />
                {nameError && (
                  <Typography sx={{ 
                    color: '#d32f2f', 
                    fontSize: '0.875rem', 
                    mt: 1,
                    fontFamily: '"Cormorant", serif'
                  }}>
                    Введите имя
                  </Typography>
                )}
              </Box>

              <Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Фамилия"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  error={surnameError}
                  InputProps={{
                    startAdornment: (
                      <Badge sx={{ 
                        color: '#d32f2f',
                        mr: 2
                      }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Cormorant", serif',
                      fontSize: '1.1rem',
                      color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': {
                        borderColor: '#444',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#888',
                      opacity: 1,
                      fontFamily: '"Cormorant", serif',
                      fontSize: '1.1rem'
                    }
                  }}
                />
                {surnameError && (
                  <Typography sx={{ 
                    color: '#d32f2f', 
                    fontSize: '0.875rem', 
                    mt: 1,
                    fontFamily: '"Cormorant", serif'
                  }}>
                    Введите фамилию
                  </Typography>
                )}
              </Box>
            </Box>

            <Box>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Эл. почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ 
                      color: '#d32f2f',
                      mr: 2
                    }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: '"Cormorant", serif',
                    fontSize: '1.1rem',
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: '#444',
                    },
                    '&:hover fieldset': {
                      borderColor: '#666',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d32f2f',
                    },
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#888',
                    opacity: 1,
                    fontFamily: '"Cormorant", serif',
                    fontSize: '1.1rem'
                  }
                }}
              />
              {emailError && (
                <Typography sx={{ 
                  color: '#d32f2f', 
                  fontSize: '0.875rem', 
                  mt: 1,
                  fontFamily: '"Cormorant", serif'
                }}>
                  Введите email
                </Typography>
              )}
            </Box>

            <Box>
              <TextField
                fullWidth
                type="password"
                variant="outlined"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ 
                      color: '#d32f2f',
                      mr: 2
                    }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: '"Cormorant", serif',
                    fontSize: '1.1rem',
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: '#444',
                    },
                    '&:hover fieldset': {
                      borderColor: '#666',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d32f2f',
                    },
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#888',
                    opacity: 1,
                    fontFamily: '"Cormorant", serif',
                    fontSize: '1.1rem'
                  }
                }}
              />
              {passwordError && (
                <Typography sx={{ 
                  color: '#d32f2f', 
                  fontSize: '0.875rem', 
                  mt: 1,
                  fontFamily: '"Cormorant", serif'
                }}>
                  Введите пароль
                </Typography>
              )}
            </Box>

            <Button 
              variant="contained"
              onClick={handleRegister}
              sx={{
                mt: 2,
                py: 1.5,
                backgroundColor: '#d32f2f',
                color: '#fff',
                fontSize: '1.1rem',
                fontFamily: '"Cormorant", serif',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderRadius: '4px',
                border: '1px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#b71c1c',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              Зарегистрироваться
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default RegisterPage;