const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChatMessage = sequelize.define("ChatMessage", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    replyToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'ChatMessages',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['createdAt']
        },
        {
            fields: ['userId']
        }
    ]
});

module.exports = ChatMessage;