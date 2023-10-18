const accountConfig = require("../../../model-config/accountConfig");
const transactionConfig = require("../../../model-config/transactionConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { preloadAssociations } = require("../../../sequelize/association");
const { startTransaction } = require("../../../sequelize/transaction");
const {
  parseFilterQueries,
  parseLimitAndOffset,
  parseSelectFields,
} = require("../../../utils/request");

class TransactionService {
  constructor() {}

  async depositAmount(settingsConfig, accountId, amount) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionService] : Inside depositAmount`);

      let myAcc = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});
      if (myAcc.length == 0) {
        throw new Error("Account Not Found");
      }

      let up = await accountConfig.model.update({ accountBalance: myAcc[0].dataValues.accountBalance + amount },{ where: { id: accountId }, transaction:t });
      if (up[0] == 0) {
        throw new Error("could not update");
      }

      let forBalance = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});

      let TransactionObj = {
        id : uuidv4(),
        senderAccountId:"00000000-0000-0000-0000-000000000000",
        receiverAccountId:accountId,
        amount: amount,
        currentBalance:forBalance[0].dataValues.accountBalance,
        type:"Credit",
        accountId:accountId
      }

      let newTransaction = await transactionConfig.model.create(TransactionObj,t)
      await t.commit();
      return {newTransaction:newTransaction, myBankId:myAcc[0].dataValues.bankId};
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }


  async withdrawAmount(settingsConfig, accountId, amount) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionService] : Inside withdrawAmount`);

      let myAcc = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});
      if (myAcc.length == 0) {
        throw new Error("Account Not Found");
      }
      if (myAcc[0].dataValues.accountBalance - amount < 1000) {
        throw new Error("insufficent balance amount exceding minimum balance");
      }

      let up = await accountConfig.model.update({ accountBalance: myAcc[0].dataValues.accountBalance - amount },{ where: { id: accountId }, transaction:t });
      if (up[0] == 0) {
        throw new Error("could not update");
      }

      let forBalance = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});

      let TransactionObj = {
        id : uuidv4(),
        senderAccountId:accountId,
        receiverAccountId:"00000000-0000-0000-0000-000000000000",
        amount: amount,
        currentBalance:forBalance[0].dataValues.accountBalance,
        type:"debit",
        accountId:accountId
      }

      let newTransaction = await transactionConfig.model.create(TransactionObj,t)
      await t.commit();
      return {newTransaction:newTransaction, myBankId:myAcc[0].dataValues.bankId};
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async transferAmount(settingsConfig, accountId, receiverAccountId, transferAmount) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionService] : Inside transferAmount`);
      console.log({accountId, receiverAccountId, transferAmount})

      let mySenderAcc = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});
      if (mySenderAcc.length == 0) {
        throw new Error("sender Account Not Found");
      }
      let myReceiverAcc = await accountConfig.model.findAll({ where: { id: receiverAccountId }, transaction:t});
      console.log(myReceiverAcc)
      if (myReceiverAcc.length == 0) {
        throw new Error("Receiver Account Not Found");
      }

      if((mySenderAcc[0].dataValues.accountBalance - transferAmount)<1000){
        throw new Error("Insufficient Balance");
      }

      let deduct = await accountConfig.model.update({ accountBalance: mySenderAcc[0].dataValues.accountBalance - transferAmount },{ where: { id: accountId }, transaction:t });
      if (deduct[0] == 0) {
        throw new Error("could not update");
      }
      let add = await accountConfig.model.update({ accountBalance: myReceiverAcc[0].dataValues.accountBalance + transferAmount },{ where: { id: receiverAccountId }, transaction:t });
      if (add[0] == 0) {
        throw new Error("could not update");
      }

      let senderBalance = await accountConfig.model.findAll({ where: { id: accountId }, transaction:t});
      let receiverBalance = await accountConfig.model.findAll({ where: { id: receiverAccountId }, transaction:t});

      let senderTransactionObj = {
        id : uuidv4(),
        senderAccountId:accountId,
        receiverAccountId:receiverAccountId,
        amount: transferAmount,
        currentBalance:senderBalance[0].dataValues.accountBalance,
        type:"debit",
        accountId:accountId
      }

      let receiverTransactionObj = {
        id : uuidv4(),
        senderAccountId:accountId,
        receiverAccountId:receiverAccountId,
        amount: transferAmount,
        currentBalance:receiverBalance[0].dataValues.accountBalance,
        type:"credit",
        accountId:receiverAccountId
      }

      let senderTransaction = await transactionConfig.model.create(senderTransactionObj,t)
      let receiverTransaction = await transactionConfig.model.create(receiverTransactionObj,t)
      console.log(mySenderAcc[0].dataValues)
      await t.commit();
      return {
        senderBankId:mySenderAcc[0].dataValues.bankId,
        receiverBankId:myReceiverAcc[0].dataValues.bankId,
        senderUserId:mySenderAcc[0].dataValues.userId,
        receiverUserId:myReceiverAcc[0].dataValues.userId,
        senderTransaction,
        receiverTransaction
      }
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getPassbook(settingsConfig, accountId, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionService] : Inside getPassbook`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: transactionConfig.fieldMapping.id,
        senderAccountId: transactionConfig.fieldMapping.senderAccountId,
        receiverAccountId: transactionConfig.fieldMapping.receiverAccountId,
        amount: transactionConfig.fieldMapping.amount,
        currentBalance: transactionConfig.fieldMapping.currentBalance,
        type: transactionConfig.fieldMapping.type,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }

      console.log(parseLimitAndOffset(queryParams))
      const data = await transactionConfig.model.findAndCountAll({
        transaction: t,
        ...parseFilterQueries(queryParams, transactionConfig.filters,{account_id:accountId}),
        attributes: selectArray,
        ...parseLimitAndOffset(queryParams),
        ...preloadAssociations(associations),
      });
      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  
}
module.exports = TransactionService;
