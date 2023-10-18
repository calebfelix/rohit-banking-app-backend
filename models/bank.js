'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bank extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      bank.hasMany(models.account,{
        foreignKey: 'bank_id',
        as:'account'
      })
    }
  }
  bank.init({
    bankName: DataTypes.STRING,
    abrivation: DataTypes.STRING,
    bankTotal: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'bank',
    underscored: true,
    paranoid:true
  });
  return bank;
};