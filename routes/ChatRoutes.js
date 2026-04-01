const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { Op } = require('sequelize');

// Получить последние сообщения
router.get('/messages', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { count, rows: messages } = await ChatMessage.findAndCountAll({
            where: { isDeleted: false },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role']
                },
                {
                    model: ChatMessage,
                    as: 'replyTo',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            messages: messages.reverse(),
            total: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Ошибка при получении сообщений' });
    }
});

// Отправить сообщение
router.post('/messages', [
    authMiddleware,
    body('message').trim().notEmpty().withMessage('Сообщение не может быть пустым').isLength({ max: 1000 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { message, replyToId } = req.body;
        
        // В req.user из токена приходит: { userId: 1, role: 'user', iat: ..., exp: ... }
        const userId = req.user.userId; // Используем userId, а не id
        
        if (!userId) {
            return res.status(401).json({ message: 'Ошибка авторизации' });
        }
        
        // Получаем username из базы данных
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        const username = user.username;
        
        console.log(`Creating message from user ${username} (ID: ${userId})`);
        
        // Проверяем существование сообщения, на которое отвечают
        if (replyToId) {
            const replyTo = await ChatMessage.findOne({
                where: { id: replyToId, isDeleted: false }
            });
            if (!replyTo) {
                return res.status(404).json({ message: 'Сообщение, на которое вы отвечаете, не найдено' });
            }
        }

        const chatMessage = await ChatMessage.create({
            userId: userId,
            username: username,
            message: message.trim(),
            replyToId: replyToId || null
        });

        // Загружаем сообщение с данными пользователя
        const messageWithUser = await ChatMessage.findByPk(chatMessage.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role']
                },
                {
                    model: ChatMessage,
                    as: 'replyTo',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username']
                    }]
                }
            ]
        });

        res.status(201).json(messageWithUser);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Ошибка при отправке сообщения' });
    }
});

// Редактировать сообщение
router.put('/messages/:id', [
    authMiddleware,
    body('message').trim().notEmpty().withMessage('Сообщение не может быть пустым').isLength({ max: 1000 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const messageId = req.params.id;
        const { message } = req.body;
        
        const userId = req.user.userId; // Используем userId
        
        const chatMessage = await ChatMessage.findByPk(messageId);
        
        if (!chatMessage) {
            return res.status(404).json({ message: 'Сообщение не найдено' });
        }

        // Проверяем права: автор или админ
        if (chatMessage.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав для редактирования этого сообщения' });
        }

        await chatMessage.update({
            message: message.trim(),
            isEdited: true
        });

        const updatedMessage = await ChatMessage.findByPk(messageId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role']
                }
            ]
        });

        res.json(updatedMessage);
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ message: 'Ошибка при редактировании сообщения' });
    }
});

// Удалить сообщение
router.delete('/messages/:id', authMiddleware, async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.userId; // Используем userId
        
        const chatMessage = await ChatMessage.findByPk(messageId);

        if (!chatMessage) {
            return res.status(404).json({ message: 'Сообщение не найдено' });
        }

        // Проверяем права: автор или админ
        if (chatMessage.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав для удаления этого сообщения' });
        }

        await chatMessage.update({ isDeleted: true });

        res.json({ message: 'Сообщение удалено' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Ошибка при удалении сообщения' });
    }
});

// Получить пользователей онлайн
router.get('/online-users', authMiddleware, async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const recentUsers = await ChatMessage.findAll({
            where: {
                createdAt: { [Op.gte]: fiveMinutesAgo }
            },
            attributes: ['userId', 'username'],
            group: ['userId', 'username'],
            order: [[ChatMessage.sequelize.literal('MAX(createdAt)'), 'DESC']]
        });

        res.json(recentUsers);
    } catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
    }
});

module.exports = router;