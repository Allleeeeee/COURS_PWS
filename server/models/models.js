const sequelize = require("../db.js");
const {DataTypes} = require("sequelize");

const Theatres = sequelize.define("Theatres", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ThName: { type: DataTypes.STRING, allowNull: false },
    ThCity: { type: DataTypes.STRING, allowNull: true },
    ThAddress: { type: DataTypes.STRING, allowNull: false },
    ThEmail: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    ThPhone: { type: DataTypes.STRING },
    ThDescription:{type:DataTypes.TEXT, allowNull:true},
    WorkingHours:{type:DataTypes.TEXT, allowNull:true},
    ThLatitude: { type: DataTypes.FLOAT, allowNull: true }, // Широта
    ThLongitude: { type: DataTypes.FLOAT, allowNull: true }
});

const Rows = sequelize.define("Rows", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    RowNumber: { type: DataTypes.INTEGER, allowNull: false },
    RowType: { type: DataTypes.STRING, allowNull: false },
    PriceMarkUp: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    Theatre_id: { type: DataTypes.INTEGER, references: { model: 'Theatres', key: 'ID' }, onDelete: 'CASCADE' }
});

const Seats = sequelize.define("Seats", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    SeatNumber: { type: DataTypes.INTEGER, allowNull: false },
    Row_id: { type: DataTypes.INTEGER, references: { model: 'Rows', key: 'ID' }, onDelete: 'CASCADE' }
});

const Users = sequelize.define("Users", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    Password: { type: DataTypes.STRING, allowNull: false },
    Name: { type: DataTypes.STRING, allowNull: false },
    Surname: { type: DataTypes.STRING, allowNull: false },
    TelegramCode:{type: DataTypes.INTEGER, allowNull: true, unique: true},
    TelegramChatId: { type: DataTypes.BIGINT, allowNull: true, unique: true },  
    Role: { type: DataTypes.STRING, allowNull: false, validate: { isIn: [['admin', 'manager', 'client']] } }
});

const TokenShemes = sequelize.define("TokenShemes", {
    User_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'ID' }, onDelete: 'CASCADE' },
    RefreshToken:{type:DataTypes.STRING, require:true},
    UserAgent: { type: DataTypes.STRING }, 
    IP: { type: DataTypes.STRING } 
})

const Managers = sequelize.define("Managers", {
    Manager_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    User_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'ID' }, onDelete: 'CASCADE' },
    Theatre_id: { type: DataTypes.INTEGER, references: { model: 'Theatres', key: 'ID' }, onDelete: 'CASCADE' },
    Phone_number: { type: DataTypes.STRING },
    Additional_info: { type: DataTypes.TEXT }
});



const Shows = sequelize.define("Shows", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Title: { type: DataTypes.STRING, allowNull: false },
    Genre: { type: DataTypes.STRING, allowNull: false },
    Duration: { type: DataTypes.INTEGER, allowNull: true, comment: 'Duration in minutes' },
    PartsCount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1},
    Description: { type: DataTypes.TEXT },
    Poster :{type:DataTypes.STRING},
    Rating: { type: DataTypes.DECIMAL(4, 2), validate: { min: 0, max: 10 } },
    Theatre_id: { type: DataTypes.INTEGER, references: { model: 'Theatres', key: 'ID' }, onDelete: 'CASCADE' },
    StartPrice: { type: DataTypes.DECIMAL(4, 2) },
    AgeRestriction: { type: DataTypes.STRING, allowNull: true, comment: 'Age restriction (e.g., 12+, 16+, 18+)' } 
});

const ShowCasts = sequelize.define('ShowCasts', {
    ID: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    Role: {type: DataTypes.STRING, allowNull:true}}, {timestamps: false});


const Casts = sequelize.define("Casts", {
    Cast_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Name: { type: DataTypes.STRING, allowNull: false },
    Surname: { type: DataTypes.STRING, allowNull: false },
    Photo:{type: DataTypes.STRING},
    Description: { type: DataTypes.TEXT },
    RoleType: { type: DataTypes.ENUM('actor', 'director', 'playwright'), defaultValue: 'actor' },
    Theatre_id: { 
        type: DataTypes.INTEGER, 
        references: { 
            model: 'Theatres', 
            key: 'ID' 
        }, 
        onDelete: 'CASCADE' 
    }
});


const Seances = sequelize.define("Seances", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    Theatre_id: { type: DataTypes.INTEGER, references: { model: 'Theatres', key: 'ID' }, onDelete: 'CASCADE' },
    Show_id: { type: DataTypes.INTEGER, references: { model: 'Shows', key: 'ID' }, onDelete: 'CASCADE' },
    Start_time: { type: DataTypes.DATE, allowNull: false },
    End_time: { type: DataTypes.DATE, allowNull: false },
    Status: { type: DataTypes.STRING, allowNull: false },
    AvailableSeats: { type: DataTypes.INTEGER, allowNull: true }
});

const Tickets = sequelize.define("Tickets", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    User_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'ID' }, onDelete: 'CASCADE' },
    Row_id: { type: DataTypes.INTEGER, references: { model: 'Rows', key: 'ID' }, onDelete: 'CASCADE' },
    Seat_id: { type: DataTypes.INTEGER, references: { model: 'Seats', key: 'ID' }, onDelete: 'CASCADE' },
    Seance_id: { type: DataTypes.INTEGER, references: { model: 'Seances', key: 'ID' }, onDelete: 'CASCADE' },
    Status: { type: DataTypes.STRING, allowNull: false, onDelete: 'CASCADE' },
    Total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, onDelete: 'CASCADE' },
    SeatStatus: { type: DataTypes.STRING,  validate: { isIn: [['Занято', 'Свободно']] }, onDelete: 'CASCADE' },
    Theatre_id: { type: DataTypes.INTEGER, references: { model: 'Theatres', key: 'ID' }, onDelete: 'CASCADE' },
    PurchaseDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Ratings = sequelize.define("Ratings", {
    ID: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    UserId: {type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'ID'},onDelete: 'CASCADE'},
    ShowId: { type: DataTypes.INTEGER, allowNull: false, references: {model: 'Shows',key: 'ID'},onDelete: 'CASCADE'},
    RatingValue: { type: DataTypes.DECIMAL(3, 1), allowNull: false, validate: {min: 1, max: 10}}},
     {timestamps: true, indexes: [{ unique: true, fields: ['UserId', 'ShowId']}]});

const Comments = sequelize.define("Comments", {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    User_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'ID' }, onDelete: 'CASCADE' },
    Show_id: { type: DataTypes.INTEGER, references: { model: 'Shows', key: 'ID' }, onDelete: 'CASCADE' },
    Content: { type: DataTypes.TEXT, allowNull: false },
    Rating: { type: DataTypes.INTEGER, allowNull: true},
    ParentComment_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Comments', key: 'ID' }, onDelete: 'CASCADE' },
    Status: { type: DataTypes.STRING, defaultValue: 'active' },
    CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});
//---------------------------------------------------------------------------------------------------------------
Theatres.hasMany(Seances, { foreignKey: "Theatre_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Seances.belongsTo(Theatres, { foreignKey: "Theatre_id" });

Theatres.hasMany(Shows, { foreignKey: "Theatre_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Shows.belongsTo(Theatres, { foreignKey: "Theatre_id" });

Theatres.hasMany(Managers, { foreignKey: "Theatre_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Managers.belongsTo(Theatres, { foreignKey: "Theatre_id" });

Theatres.hasMany(Rows, { foreignKey: "Theatre_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Rows.belongsTo(Theatres, { foreignKey: "Theatre_id" });

Theatres.hasMany(Casts, { 
    foreignKey: "Theatre_id", 
    onDelete: "CASCADE", 
    onUpdate: 'CASCADE' 
});

// Актер принадлежит театру
Casts.belongsTo(Theatres, { 
    foreignKey: "Theatre_id" 
});
//---------------------------------------------------------------------------------------------------------------

Rows.hasMany(Seats, { foreignKey: "Row_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Seats.belongsTo(Rows, { foreignKey: "Row_id", as:"Row" });

Rows.hasOne(Tickets, { foreignKey: "Row_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Tickets.belongsTo(Rows, { foreignKey: "Row_id" });

//---------------------------------------------------------------------------------------------------------------
Seats.hasOne(Tickets, { foreignKey: "Seat_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Tickets.belongsTo(Seats, { foreignKey: "Seat_id" });
//---------------------------------------------------------------------------------------------------------------

Seances.hasMany(Tickets, { foreignKey: "Seance_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Tickets.belongsTo(Seances, { foreignKey: "Seance_id" });

//---------------------------------------------------------------------------------------------------------------
Shows.hasOne(Seances, { foreignKey: "Show_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Seances.belongsTo(Shows, { foreignKey: "Show_id" });
Shows.belongsToMany(Casts, {
    through: ShowCasts,
    foreignKey: 'Show_id',
    otherKey: 'Cast_id',
    as: 'actors'
});

// Актер участвует во многих спектаклях через ShowCasts
Casts.belongsToMany(Shows, {
    through: ShowCasts,
    foreignKey: 'Cast_id',
    otherKey: 'Show_id',
    as: 'shows'
});

Shows.hasMany(Ratings, { foreignKey: 'ShowId' });
Ratings.belongsTo(Shows, { foreignKey: 'ShowId' });
Ratings.belongsTo(Users, { foreignKey: 'UserId' });
Users.hasMany(Ratings, { foreignKey: 'UserId' });



//---------------------------------------------------------------------------------------------------------------

Users.hasMany(Tickets, { foreignKey: "User_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Tickets.belongsTo(Users, { foreignKey: "User_id" });

Users.hasOne(Managers, { foreignKey: "User_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Managers.belongsTo(Users, { foreignKey: "User_id", as:"User" });

Users.hasOne(TokenShemes,{foreignKey: "User_id", onDelete: "CASCADE", onUpdate: 'CASCADE'});
TokenShemes.belongsTo(Users, {foreignKey:"User_id"});

Users.hasMany(Comments, { foreignKey: "User_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Comments.belongsTo(Users, { foreignKey: "User_id" });

Shows.hasMany(Comments, { foreignKey: "Show_id", onDelete: "CASCADE", onUpdate: 'CASCADE' });
Comments.belongsTo(Shows, { foreignKey: "Show_id" });

Comments.hasMany(Comments, { foreignKey: "ParentComment_id", as: "Replies", onDelete: "CASCADE" });
Comments.belongsTo(Comments, { foreignKey: "ParentComment_id", as: "ParentComment" });


module.exports = {
    Theatres,
    Rows,
    Seats,
    Users,
    TokenShemes,
    Managers,
    Casts,
    Shows,
    ShowCasts,
    Seances,
    Tickets,
    Ratings,
    Comments
};



