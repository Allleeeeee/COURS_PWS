const {Sequelize} = require("sequelize");

const sequelize = new Sequelize(
    "afisha_app",
    "postgres",
    "Pa$$w0rd",
    {
        dialect: "postgres",
        host: "localhost",
        port: 5432,
        logging: false,
        pool: {
          max: 50,
          min: 0,
          idle: 10000,
        },
        define: {
            timestamps: false 
        }
    }
)

module.exports = sequelize;