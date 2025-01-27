"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: 'userId'
      })
      // define association here
    }

    static addTodo({ title,description, startDate, endDate, userId }) {
      return this.create({ title: title,description: description, startDate: startDate, endDate: endDate, completed: false, userId });
    }

    static getTodos(userId) {
      return this.findAll(
        {
          where: {
            userId,
          },
        }
      );
    }

    static async remove(id, userId) {
      this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static async completedItems(userId) {
      return this.findAll({
        where: {
          [Op.and]: [{
            userId,
            completed: true,
          }]
        },
      });
    }

    static async deleteAll() {
      this.destroy({ where: {} });
    }

    setCompletionStatus(state) {
      return this.update({ completed: state });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      startDate: DataTypes.DATEONLY,
      endDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
