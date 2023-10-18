'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      transaction.belongsTo(models.bank,{
        foreignKey: 'account_id',
        as:'account'
      })
    }
  }
  transaction.init({
    senderAccountId: DataTypes.UUID,
    receiverAccountId: DataTypes.UUID,
    amount: DataTypes.INTEGER,
    currentBalance: DataTypes.INTEGER,
    type: DataTypes.STRING,
    accountId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'transaction',
    underscored: true,
    paranoid:true
  });
  return transaction;
};