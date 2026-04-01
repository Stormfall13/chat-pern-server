const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Product = require('./Product');
const User = require('./User');
const Favorite = require("./Favorite");
const Category = require("./Category");
const ChatMessage = require("./ChatMessage");

// 🔁 Все связи определяем здесь
Cart.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Cart.hasMany(CartItem, { foreignKey: "cartId", onDelete: "CASCADE" });

CartItem.belongsTo(Cart, { foreignKey: "cartId", onDelete: "CASCADE" });
CartItem.belongsTo(Product, { foreignKey: "productId", onDelete: "CASCADE" });

User.hasMany(Favorite, { foreignKey: 'userId' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Favorite, { foreignKey: 'productId' });
Favorite.belongsTo(Product, { foreignKey: 'productId' });

Category.hasMany(Product, { foreignKey: "categoryId", onDelete: "CASCADE" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

// Ассоциации для чата
User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Для ответов на сообщения
ChatMessage.belongsTo(ChatMessage, { foreignKey: 'replyToId', as: 'replyTo' });
ChatMessage.hasMany(ChatMessage, { foreignKey: 'replyToId', as: 'replies' });


module.exports = {
  Cart,
  CartItem,
  Product,
  User,
  Favorite,
  ChatMessage,
};
