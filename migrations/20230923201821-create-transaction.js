'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sender_accountId: {
        type: Sequelize.INTEGER
      },
      recever_accountId: {
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.INTEGER
      },
      current_balance: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      account_id:{
        allowNull: false,
        type: Sequelize.INTEGER,
        onDelete:'CASCADE',
        onUpdate:'CASCADE',
        references:{
          model:{
            tableName:'accounts',
          }
        },
        key:'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};