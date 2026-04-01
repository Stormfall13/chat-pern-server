// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//         host: process.env.DB_HOST,
//         port: process.env.DB_PORT,
//         dialect: "postgres",
//         logging: false, // Убираем лишние логи
//     }
// );

// const ServerDB = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log("✅ Database connected successfully");
//     } catch (error) {
//         console.error("❌ Unable to connect to the database:", error);
//     }
// };

// ServerDB();

// module.exports = sequelize;


// КОД ДЛЯ ПРОДА НИЖЕ РАСКОММЕНТИРОВАТЬ 


const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log // 👈 Покажет SQL-запросы в логах
});

const ServerDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Unable to connect to the database:", error);
    }
};

ServerDB();

module.exports = sequelize;