'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      sender_account_id: {
        type: Sequelize.UUID
      },
      reciver_account_id: {
        type: Sequelize.UUID
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
      deleted_at: {
        type: Sequelize.DATE
      },
      account_id:{
        allowNull: false,
        type: Sequelize.UUID,
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