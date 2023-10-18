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
const accountConfig = require("../../../model-config/accountConfig");

class AccountService {
  constructor() {}

  associationMap = {
    transaction: {
      model: transactionConfig.model,
      as: "transaction",
    },
  };

  async createAccount(settingsConfig,bankName,userId, body) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[AccountService] : Inside createAccount`);

      body.id = uuidv4();
      body.userId = userId;
      body.bankName = bankName;

      console.log(body);
      
      const data = await accountConfig.model.create(body, { transaction: t });

      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getAllAccounts(settingsConfig, userId, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[AccountService] : Inside getAllAccounts`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: accountConfig.fieldMapping.id,
        bankName: accountConfig.fieldMapping.bankName,
        accountBalance: accountConfig.fieldMapping.accountBalance,
        userId: accountConfig.fieldMapping.userId,
        bankId: accountConfig.fieldMapping.bankId,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      const data = await accountConfig.model.findAndCountAll({
        transaction: t,
        ...parseFilterQueries(queryParams, accountConfig.filters,{user_id:userId}),
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

  async getAccountById(settingsConfig, userId,accountId, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[AccountService] : Inside getAccountById`);
      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: accountConfig.fieldMapping.id,
        bankName: accountConfig.fieldMapping.bankName,
        accountBalance: accountConfig.fieldMapping.accountBalance,
        userId: accountConfig.fieldMapping.userId,
        bankId: accountConfig.fieldMapping.bankId,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      const data = await accountConfig.model.findAll({
        ...parseFilterQueries(queryParams, accountConfig.filters, { id: accountId, user_id: userId }),
        attributes: selectArray,
        transaction: t,
        ...preloadAssociations(associations),
      });
      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // async updateBank(settingsConfig, bankId, body) {
  //   const t = await startTransaction();
  //   try {
  //     const logger = settingsConfig.logger;
  //     logger.info(`[AccountService] : Inside updateBank`);

  //     let { newValue } = body;
  //     if(newValue==undefined){
  //       throw new Error("invalid parameter")
  //     }

  //     let up = await accountConfig.model.update(
  //       { bankName: newValue },
  //       { where: { id: bankId }, transaction: t }
  //     );
  //     let newAbrivation = this.abrivation(newValue);
  //     await bankConfig.model.update(
  //       { abrivation: newAbrivation },
  //       { where: { id: bankId }, transaction: t }
  //     );
  //     await t.commit();
  //     console.log(up);
  //     return up;
  //   } catch (error) {
  //     await t.rollback();
  //     throw error;
  //   }
  // }

  // async getBankTotal(settingsConfig, bankId) {
  //   const t = await startTransaction();
  //   try {
  //     const logger = settingsConfig.logger;
  //     logger.info(`[AccountService] : Inside getBankTotal`);

  //     await this.updateBankTotal(settingsConfig, bankId)

  //     let myBank = await bankConfig.model.findAll({
  //       where: { id: bankId },
  //       attributes: ["bank_total"],
  //     });
  //     await t.commit();
  //     return myBank;
  //   } catch (error) {
  //     await t.rollback();
  //     throw error;
  //   }
  // }

  // async updateBankTotal(settingsConfig, bankId) {
  //   const t = await startTransaction();
  //   try {
  //     const logger = settingsConfig.logger;
  //     logger.info(`[AccountService] : Inside updateBankTotal`);

  //     let total = 0;
  //     let [myBank] = await bankConfig.model.findAll({
  //       transaction: t,
  //       where: { id: bankId },
  //       attributes: ["bank_total"],
  //       include: { model: accountConfig.model,as:"account", attributes: ["account_balance"] },
  //     });
  //     myBank.account.forEach((element) => {
  //       total = total + element.dataValues.account_balance;
  //     });
  //     let up = await bankConfig.model.update(
  //       { bankTotal: total },
  //       { where: { id: bankId }, transaction: t }
  //     );
  //     if ([up] == 0) {
  //       throw new Error("could not update Bank total");
  //     }
  //     let returnBank = await bankConfig.model.findAll({
  //       transaction: t,
  //       where: { id: bankId },
  //     });
  //     await t.commit();
  //     return returnBank;
  //   } catch (error) {
  //     await t.rollback();
  //     throw error;
  //   }
  // }

  createAssociation(includeQuery, selectArray) {
    let associations = [];
    if (!Array.isArray(includeQuery)) {
      includeQuery = [includeQuery];
    }
    console.log(includeQuery)
    if (includeQuery?.includes(accountConfig.associations.transactionFilter)) {
      associations.push(this.associationMap.transaction);
    }

    return associations;
  }
}
module.exports = AccountService;
