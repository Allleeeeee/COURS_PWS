// pages/PoiskKinoPersonsPage.jsx
import { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../..";
import {
    Box, Paper, Typography, TextField, Button,
    Chip, Grid, Card, CardContent, CardMedia,
    CircularProgress, Alert, Pagination,
    FormControl, InputLabel, Select, MenuItem,
    Checkbox, ListItemText, Slider, Divider,
    Avatar, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, CardActionArea,
    ToggleButton, ToggleButtonGroup
} from "@mui/material";
import {
    Search, FilterList, Person, Close,
    LocationOn, Cake, Star, Male, Female,
    ViewList, ViewModule
} from "@mui/icons-material";

const PoiskPerson = observer(() => {
    const { store } = useContext(Context);
    
    // Локальное состояние
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProfessions, setSelectedProfessions] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [ageRange, setAgeRange] = useState([0, 100]);
    const [birthPlace, setBirthPlace] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortType, setSortType] = useState('1');
    const [limit, setLimit] = useState(20);
    const [viewMode, setViewMode] = useState('grid');
    const [openFilters, setOpenFilters] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [openDetails, setOpenDetails] = useState(false);

    // Инициализация стора если не инициализирован
    useEffect(() => {
        // Проверяем и инициализируем если нужно
        if (!store.poiskPersons) {
            store.poiskPersons = [];
        }
        if (!store.poiskSearchParams) {
            store.poiskSearchParams = {
                query: '',
                page: 1,
                limit: 20,
                profession: [],
                sex: [],
                ageRange: null,
                birthPlace: '',
                sortField: 'name',
                sortType: '1'
            };
        }
        
        loadPersons();
    }, []);

    // Загрузка персон
    const loadPersons = async (page = 1) => {
        try {
            const params = {
                query: searchQuery,
                profession: selectedProfessions,
                sex: selectedGenders,
                age: ageRange[0] === 0 && ageRange[1] === 100 ? null : `${ageRange[0]}-${ageRange[1]}`,
                birthPlace: birthPlace ? [birthPlace] : [],
                sortField: [sortField],
                sortType: [sortType],
                limit: limit,
                page: page
            };
            
            // Убираем пустые параметры
            Object.keys(params).forEach(key => {
                if (params[key] === null || params[key] === '' || 
                    (Array.isArray(params[key]) && params[key].length === 0)) {
                    delete params[key];
                }
            });
            
            console.log('Loading persons with params:', params);
            await store.searchPoiskPersons(params);
        } catch (error) {
            console.error('Error loading persons:', error);
        }
    };

    // Обработка поиска
    const handleSearch = () => {
        if (store.setPoiskSearchParam) {
            store.setPoiskSearchParam('page', 1);
        }
        loadPersons(1);
    };

    // Сброс фильтров
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedProfessions([]);
        setSelectedGenders([]);
        setAgeRange([0, 100]);
        setBirthPlace('');
        setSortField('name');
        setSortType('1');
        setLimit(20);
        if (store.resetPoiskFilters) {
            store.resetPoiskFilters();
        }
        loadPersons(1);
    };

    // Пагинация
    const handlePageChange = (event, page) => {
        loadPersons(page);
    };

    // Открытие деталей персоны
    const handleOpenDetails = async (personId) => {
        try {
            if (store.getPoiskPersonDetails) {
                await store.getPoiskPersonDetails(personId);
                setSelectedPerson(store.selectedPoiskPerson);
                setOpenDetails(true);
            }
        } catch (error) {
            console.error('Error loading person details:', error);
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU');
        } catch {
            return dateString;
        }
    };

    // Форматирование возраста
    const formatAge = (age) => {
        if (!age && age !== 0) return 'Не указано';
        const numAge = Number(age);
        if (isNaN(numAge)) return age;
        
        const lastDigit = numAge % 10;
        const lastTwoDigits = numAge % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return `${numAge} лет`;
        }
        
        if (lastDigit === 1) {
            return `${numAge} год`;
        }
        
        if (lastDigit >= 2 && lastDigit <= 4) {
            return `${numAge} года`;
        }
        
        return `${numAge} лет`;
    };

    // Рендеринг профессий
    const renderProfessions = (professions) => {
        if (!professions || !Array.isArray(professions)) return null;
        
        const validProfessions = professions.filter(p => p && (p.value || p));
        if (validProfessions.length === 0) return null;
        
        return (
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {validProfessions.slice(0, 3).map((prof, index) => (
                    <Chip
                        key={index}
                        label={prof.value || prof}
                        size="small"
                        sx={{
                            backgroundColor: '#424242',
                            color: 'white',
                            fontSize: '0.7rem'
                        }}
                    />
                ))}
                {validProfessions.length > 3 && (
                    <Chip
                        label={`+${validProfessions.length - 3}`}
                        size="small"
                        sx={{
                            backgroundColor: '#616161',
                            color: 'white',
                            fontSize: '0.7rem'
                        }}
                    />
                )}
            </Box>
        );
    };

    // Получение безопасного доступа к данным
    const getPersons = () => {
        if (!store.poiskPersons || !Array.isArray(store.poiskPersons)) {
            return [];
        }
        return store.poiskPersons;
    };

    const getTotalPersons = () => {
        return store.poiskTotalPersons || 0;
    };

    const getTotalPages = () => {
        return store.poiskTotalPages || 1;
    };

    const getCurrentPage = () => {
        return (store.poiskSearchParams && store.poiskSearchParams.page) || 1;
    };

    const getLoading = () => {
        return store.poiskLoading || false;
    };

    const getError = () => {
        return store.poiskError || null;
    };

    const getProfessionsList = () => {
        if (store.poiskProfessions && Array.isArray(store.poiskProfessions)) {
            return store.poiskProfessions;
        }
        return [
            { value: 'Актер', label: 'Актёр' },
            { value: 'Режиссер', label: 'Режиссёр' },
            { value: 'Продюсер', label: 'Продюсер' },
            { value: 'Сценарист', label: 'Сценарист' },
            { value: 'Оператор', label: 'Оператор' },
            { value: 'Композитор', label: 'Композитор' },
            { value: 'Художник', label: 'Художник' },
        ];
    };

    const getGendersList = () => {
        if (store.poiskGenders && Array.isArray(store.poiskGenders)) {
            return store.poiskGenders;
        }
        return [
            { value: 'Мужской', label: 'Мужской' },
            { value: 'Женский', label: 'Женский' },
        ];
    };

    const getSortFields = () => {
        if (store.poiskSortFields && Array.isArray(store.poiskSortFields)) {
            return store.poiskSortFields;
        }
        return [
            { value: 'name', label: 'Имя' },
            { value: 'age', label: 'Возраст' },
            { value: 'countAwards', label: 'Количество наград' },
            { value: 'birthday', label: 'Дата рождения' },
            { value: 'updatedAt', label: 'Дата обновления' },
        ];
    };

    const persons = getPersons();
    const totalPersons = getTotalPersons();
    const totalPages = getTotalPages();
    const currentPage = getCurrentPage();
    const loading = getLoading();
    const error = getError();
    const professionsList = getProfessionsList();
    const gendersList = getGendersList();
    const sortFieldsList = getSortFields();

    return (
        <Box sx={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            <Box sx={{ p: 3 }}>
                {/* Заголовок */}
                <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#2a2a2a' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <Person sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
                        <Box>
                            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                                База данных киноперсон
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#aaa' }}>
                                Поиск актёров, режиссёров, сценаристов и других кинематографистов
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Панель поиска */}
                <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#2a2a2a' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Поиск по имени..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: '#555' },
                                        '&:hover fieldset': { borderColor: '#d32f2f' },
                                        '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
                                        color: 'white'
                                    },
                                    '& .MuiInputLabel-root': { color: '#aaa' }
                                }}
                                InputProps={{
                                    startAdornment: <Search sx={{ color: '#aaa', mr: 1 }} />
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={6} md={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleSearch}
                                sx={{
                                    py: 1.5,
                                    backgroundColor: '#d32f2f',
                                    '&:hover': { backgroundColor: '#b71c1c' }
                                }}
                            >
                                Найти
                            </Button>
                        </Grid>
                        
                        <Grid item xs={6} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterList />}
                                onClick={() => setOpenFilters(true)}
                                sx={{
                                    py: 1.5,
                                    borderColor: '#555',
                                    color: 'white',
                                    '&:hover': { borderColor: '#d32f2f' }
                                }}
                            >
                                Фильтры
                            </Button>
                        </Grid>
                        
                        <Grid item xs={6} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleResetFilters}
                                sx={{
                                    py: 1.5,
                                    borderColor: '#555',
                                    color: 'white',
                                    '&:hover': { borderColor: '#d32f2f' }
                                }}
                            >
                                Сбросить
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Активные фильтры */}
                    {(selectedProfessions.length > 0 || selectedGenders.length > 0 || birthPlace || 
                      (ageRange[0] > 0 || ageRange[1] < 100) || searchQuery) && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                Активные фильтры:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {searchQuery && (
                                    <Chip
                                        label={`Поиск: ${searchQuery}`}
                                        size="small"
                                        onDelete={() => setSearchQuery('')}
                                        sx={{ backgroundColor: '#424242', color: 'white' }}
                                    />
                                )}
                                {selectedProfessions.map(prof => (
                                    <Chip
                                        key={prof}
                                        label={prof}
                                        size="small"
                                        onDelete={() => setSelectedProfessions(
                                            selectedProfessions.filter(p => p !== prof)
                                        )}
                                        sx={{ backgroundColor: '#424242', color: 'white' }}
                                    />
                                ))}
                                {selectedGenders.map(gender => (
                                    <Chip
                                        key={gender}
                                        label={gender}
                                        size="small"
                                        onDelete={() => setSelectedGenders(
                                            selectedGenders.filter(g => g !== gender)
                                        )}
                                        sx={{ backgroundColor: '#424242', color: 'white' }}
                                    />
                                ))}
                                {birthPlace && (
                                    <Chip
                                        label={`Место: ${birthPlace}`}
                                        size="small"
                                        onDelete={() => setBirthPlace('')}
                                        sx={{ backgroundColor: '#424242', color: 'white' }}
                                    />
                                )}
                                {(ageRange[0] > 0 || ageRange[1] < 100) && (
                                    <Chip
                                        label={`Возраст: ${ageRange[0]}-${ageRange[1]}`}
                                        size="small"
                                        onDelete={() => setAgeRange([0, 100])}
                                        sx={{ backgroundColor: '#424242', color: 'white' }}
                                    />
                                )}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Диалог фильтров */}
                <Dialog 
                    open={openFilters} 
                    onClose={() => setOpenFilters(false)} 
                    maxWidth="sm" 
                    fullWidth
                    PaperProps={{
                        sx: { backgroundColor: '#2a2a2a' }
                    }}
                >
                    <DialogTitle sx={{ color: 'white' }}>
                        <Box display="flex" alignItems="center">
                            <FilterList sx={{ mr: 1 }} />
                            Фильтры поиска
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {/* Профессии */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel sx={{ color: '#aaa' }}>Профессии</InputLabel>
                            <Select
                                multiple
                                value={selectedProfessions}
                                onChange={(e) => setSelectedProfessions(e.target.value)}
                                renderValue={(selected) => selected.join(', ')}
                                sx={{
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d32f2f' }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: '#2a2a2a',
                                            color: 'white'
                                        }
                                    }
                                }}
                            >
                                {professionsList.map((prof) => (
                                    <MenuItem key={prof.value} value={prof.value}>
                                        <Checkbox 
                                            checked={selectedProfessions.indexOf(prof.value) > -1}
                                            sx={{ color: '#aaa' }}
                                        />
                                        <ListItemText primary={prof.label} sx={{ color: 'white' }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Пол */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel sx={{ color: '#aaa' }}>Пол</InputLabel>
                            <Select
                                multiple
                                value={selectedGenders}
                                onChange={(e) => setSelectedGenders(e.target.value)}
                                renderValue={(selected) => selected.join(', ')}
                                sx={{
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: '#2a2a2a',
                                            color: 'white'
                                        }
                                    }
                                }}
                            >
                                {gendersList.map((gender) => (
                                    <MenuItem key={gender.value} value={gender.value}>
                                        <Checkbox 
                                            checked={selectedGenders.indexOf(gender.value) > -1}
                                            sx={{ color: '#aaa' }}
                                        />
                                        <ListItemText primary={gender.label} sx={{ color: 'white' }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Возраст */}
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ color: 'white', mb: 2 }}>
                                Возраст: {ageRange[0]} - {ageRange[1]} лет
                            </Typography>
                            <Slider
                                value={ageRange}
                                onChange={(e, newValue) => setAgeRange(newValue)}
                                valueLabelDisplay="auto"
                                min={0}
                                max={100}
                                sx={{ color: '#d32f2f' }}
                            />
                        </Box>

                        {/* Место рождения */}
                        <TextField
                            fullWidth
                            label="Место рождения"
                            value={birthPlace}
                            onChange={(e) => setBirthPlace(e.target.value)}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': { color: 'white' },
                                '& .MuiInputLabel-root': { color: '#aaa' }
                            }}
                        />

                        {/* Сортировка */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#aaa' }}>Сортировать по</InputLabel>
                                    <Select
                                        value={sortField}
                                        onChange={(e) => setSortField(e.target.value)}
                                        sx={{ color: 'white' }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    backgroundColor: '#2a2a2a',
                                                    color: 'white'
                                                }
                                            }
                                        }}
                                    >
                                        {sortFieldsList.map((field) => (
                                            <MenuItem key={field.value} value={field.value}>
                                                {field.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#aaa' }}>Порядок</InputLabel>
                                    <Select
                                        value={sortType}
                                        onChange={(e) => setSortType(e.target.value)}
                                        sx={{ color: 'white' }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    backgroundColor: '#2a2a2a',
                                                    color: 'white'
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="1">По возрастанию</MenuItem>
                                        <MenuItem value="-1">По убыванию</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Количество на странице */}
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: '#aaa' }}>На странице</InputLabel>
                            <Select
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                sx={{ color: 'white' }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: '#2a2a2a',
                                            color: 'white'
                                        }
                                    }
                                }}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ backgroundColor: '#2a2a2a' }}>
                        <Button 
                            onClick={() => setOpenFilters(false)} 
                            sx={{ color: '#aaa' }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                setOpenFilters(false);
                                handleSearch();
                            }}
                            variant="contained"
                            sx={{ backgroundColor: '#d32f2f' }}
                        >
                            Применить
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Панель управления видом */}
                <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: '#2a2a2a' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ color: 'white' }}>
                            Найдено {totalPersons} персон
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                                size="small"
                            >
                                <ToggleButton value="grid" sx={{ color: 'white' }}>
                                    <ViewModule />
                                </ToggleButton>
                                <ToggleButton value="list" sx={{ color: 'white' }}>
                                    <ViewList />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                </Paper>

                {/* Загрузка */}
                {loading ? (
                    <Box display="flex" justifyContent="center" my={8}>
                        <CircularProgress sx={{ color: '#d32f2f' }} size={60} />
                    </Box>
                ) : error ? (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 3 }}
                        action={
                            <Button 
                                color="inherit" 
                                size="small"
                                onClick={handleSearch}
                            >
                                Повторить
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                ) : persons.length === 0 ? (
                    <Paper elevation={3} sx={{ p: 8, textAlign: 'center', backgroundColor: '#2a2a2a' }}>
                        <Person sx={{ fontSize: 60, color: '#555', mb: 2 }} />
                        <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                            Ничего не найдено
                        </Typography>
                        <Typography sx={{ color: '#aaa', mb: 3 }}>
                            Попробуйте изменить параметры поиска
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleResetFilters}
                            sx={{ color: 'white', borderColor: '#555' }}
                        >
                            Сбросить фильтры
                        </Button>
                    </Paper>
                ) : (
                    <>
                        {/* Карточки персон */}
                        <Grid container spacing={3}>
                            {persons.map((person) => {
                                if (!person) return null;
                                
                                const personName = person.name || '';
                                const personSurname = person.surname || '';
                                const personPhoto = person.photo || '/placeholder-person.jpg';
                                const personSex = person.sex || '';
                                const personAge = person.age;
                                const personBirthPlace = person.birthPlace || {};
                                const personProfessions = person.profession || [];
                                
                                return (
                                    <Grid 
                                        item 
                                        xs={12} 
                                        sm={viewMode === 'grid' ? 6 : 12} 
                                        md={viewMode === 'grid' ? 4 : 12} 
                                        lg={viewMode === 'grid' ? 3 : 12} 
                                        key={person.id || person._id || Math.random()}
                                    >
                                        <Card 
                                            sx={{ 
                                                backgroundColor: '#2a2a2a',
                                                color: 'white',
                                                height: viewMode === 'grid' ? '100%' : 'auto',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 20px rgba(0,0,0,0.3)',
                                                    backgroundColor: '#323232'
                                                }
                                            }}
                                        >
                                            <CardActionArea onClick={() => person.id && handleOpenDetails(person.id)}>
                                                {viewMode === 'grid' ? (
                                                    // Grid view
                                                    <>
                                                        <CardMedia
                                                            component="img"
                                                            height="220"
                                                            image={personPhoto}
                                                            alt={`${personName} ${personSurname}`}
                                                            sx={{ objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                e.target.src = '/placeholder-person.jpg';
                                                            }}
                                                        />
                                                        <CardContent>
                                                            <Typography variant="h6" gutterBottom noWrap>
                                                                {personName} {personSurname}
                                                            </Typography>
                                                            
                                                            <Box display="flex" alignItems="center" mb={1}>
                                                                {personSex === 'Мужской' ? (
                                                                    <Male sx={{ fontSize: 16, color: '#2196f3', mr: 1 }} />
                                                                ) : personSex === 'Женский' ? (
                                                                    <Female sx={{ fontSize: 16, color: '#e91e63', mr: 1 }} />
                                                                ) : null}
                                                                <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                                    {personSex || 'Не указано'}
                                                                </Typography>
                                                            </Box>

                                                            {personAge !== undefined && personAge !== null && (
                                                                <Box display="flex" alignItems="center" mb={1}>
                                                                    <Cake sx={{ fontSize: 16, color: '#aaa', mr: 1 }} />
                                                                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                                        {formatAge(personAge)}
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {renderProfessions(personProfessions)}

                                                            {personBirthPlace.value && (
                                                                <Box display="flex" alignItems="center" mt={1}>
                                                                    <LocationOn sx={{ fontSize: 16, color: '#aaa', mr: 1 }} />
                                                                    <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }} noWrap>
                                                                        {personBirthPlace.value}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </CardContent>
                                                    </>
                                                ) : (
                                                    // List view
                                                    <Box display="flex">
                                                        <CardMedia
                                                            component="img"
                                                            width="120"
                                                            image={personPhoto}
                                                            alt={`${personName} ${personSurname}`}
                                                            sx={{ 
                                                                width: 120,
                                                                objectFit: 'cover',
                                                                flexShrink: 0
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = '/placeholder-person.jpg';
                                                            }}
                                                        />
                                                        <CardContent sx={{ flexGrow: 1 }}>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12} md={4}>
                                                                    <Typography variant="h6">
                                                                        {personName} {personSurname}
                                                                    </Typography>
                                                                    <Box display="flex" alignItems="center" mt={1}>
                                                                        {personSex === 'Мужской' ? (
                                                                            <Male sx={{ fontSize: 16, color: '#2196f3', mr: 1 }} />
                                                                        ) : personSex === 'Женский' ? (
                                                                            <Female sx={{ fontSize: 16, color: '#e91e63', mr: 1 }} />
                                                                        ) : null}
                                                                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                                            {personSex || 'Не указано'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                                
                                                                <Grid item xs={6} md={2}>
                                                                    <Typography variant="body2" sx={{ color: '#aaa' }}>Возраст</Typography>
                                                                    <Typography>{formatAge(personAge)}</Typography>
                                                                </Grid>
                                                                
                                                                <Grid item xs={6} md={3}>
                                                                    <Typography variant="body2" sx={{ color: '#aaa' }}>Место рождения</Typography>
                                                                    <Typography noWrap>
                                                                        {personBirthPlace.value || 'Не указано'}
                                                                    </Typography>
                                                                </Grid>
                                                                
                                                                <Grid item xs={12} md={3}>
                                                                    <Typography variant="body2" sx={{ color: '#aaa' }}>Профессии</Typography>
                                                                    {renderProfessions(personProfessions)}
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Box>
                                                )}
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {/* Пагинация */}
                        {totalPages > 1 && (
                            <Box display="flex" justifyContent="center" mt={4} mb={2}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            color: 'white',
                                            borderColor: '#555',
                                            '&:hover': {
                                                backgroundColor: '#424242'
                                            },
                                            '&.Mui-selected': {
                                                backgroundColor: '#d32f2f',
                                                '&:hover': {
                                                    backgroundColor: '#b71c1c'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}

                {/* Диалог с деталями персоны */}
                <Dialog 
                    open={openDetails} 
                    onClose={() => setOpenDetails(false)} 
                    maxWidth="md" 
                    fullWidth
                    PaperProps={{
                        sx: { 
                            backgroundColor: '#2a2a2a',
                            color: 'white'
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6">Детальная информация</Typography>
                        <IconButton 
                            onClick={() => setOpenDetails(false)} 
                            sx={{ color: 'white' }}
                        >
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    
                    <DialogContent>
                        {selectedPerson && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Avatar
                                        src={selectedPerson.photo}
                                        sx={{ 
                                            width: '100%', 
                                            height: 'auto', 
                                            borderRadius: 2,
                                            maxHeight: 400
                                        }}
                                        variant="rounded"
                                        imgProps={{
                                            onError: (e) => {
                                                e.target.src = '/placeholder-person.jpg';
                                            }
                                        }}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={8}>
                                    <Typography variant="h4" gutterBottom>
                                        {selectedPerson.name || ''} {selectedPerson.surname || ''}
                                    </Typography>
                                    
                                    {selectedPerson.enName && (
                                        <Typography variant="subtitle1" color="#aaa" gutterBottom>
                                            {selectedPerson.enName}
                                        </Typography>
                                    )}

                                    <Divider sx={{ my: 2, bgcolor: '#444' }} />

                                    <Grid container spacing={2}>
                                        {/* Основная информация */}
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="body2" color="#aaa">Пол</Typography>
                                            <Typography>{selectedPerson.sex || 'Не указано'}</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="body2" color="#aaa">Возраст</Typography>
                                            <Typography>{formatAge(selectedPerson.age)}</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="body2" color="#aaa">Рост</Typography>
                                            <Typography>{selectedPerson.growth || 'Не указано'} см</Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="body2" color="#aaa">Дата рождения</Typography>
                                            <Typography>{formatDate(selectedPerson.birthday)}</Typography>
                                        </Grid>
                                        
                                        {selectedPerson.death && (
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="#aaa">Дата смерти</Typography>
                                                <Typography>{formatDate(selectedPerson.death)}</Typography>
                                            </Grid>
                                        )}
                                        
                                        {selectedPerson.countAwards > 0 && (
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="#aaa">Награды</Typography>
                                                <Box display="flex" alignItems="center">
                                                    <Star sx={{ color: '#ffd700', mr: 1, fontSize: 16 }} />
                                                    <Typography>{selectedPerson.countAwards}</Typography>
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Места */}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="#aaa">Место рождения</Typography>
                                            <Typography>{selectedPerson.birthPlace?.value || 'Не указано'}</Typography>
                                        </Grid>
                                        
                                        {selectedPerson.deathPlace?.value && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="#aaa">Место смерти</Typography>
                                                <Typography>{selectedPerson.deathPlace.value}</Typography>
                                            </Grid>
                                        )}

                                        {/* Профессии */}
                                        {selectedPerson.profession && Array.isArray(selectedPerson.profession) && selectedPerson.profession.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="#aaa">Профессии</Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                                    {selectedPerson.profession.map((prof, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={prof.value || prof}
                                                            size="small"
                                                            sx={{ 
                                                                backgroundColor: '#424242', 
                                                                color: 'white',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Факты */}
                                        {selectedPerson.facts && Array.isArray(selectedPerson.facts) && selectedPerson.facts.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="#aaa">Интересные факты</Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {selectedPerson.facts.map((fact, index) => (
                                                        <Typography 
                                                            key={index} 
                                                            paragraph 
                                                            sx={{ 
                                                                mb: 1,
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            • {fact.value || fact}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Супруги */}
                                        {selectedPerson.spouses && Array.isArray(selectedPerson.spouses) && selectedPerson.spouses.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="#aaa">Супруги</Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {selectedPerson.spouses.map((spouse, index) => (
                                                        <Typography 
                                                            key={index} 
                                                            sx={{ 
                                                                mb: 0.5,
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            • {spouse.name || ''} {spouse.divorced ? '(в разводе)' : ''}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    
                    <DialogActions>
                        <Button 
                            onClick={() => setOpenDetails(false)}
                            sx={{ color: '#aaa' }}
                        >
                            Закрыть
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
});

export default PoiskPerson;