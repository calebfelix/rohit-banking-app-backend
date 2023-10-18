const bankConfig = require("../../../model-config/bankConfig");
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

class BankService {
  constructor() {}

  associationMap = {
    account: {
      model: accountConfig.model,
      as: "account",
    },
  };


  abrivation(bankName) {
    let upper = bankName.toUpperCase().split(" ");
    let words = upper.map((word) => {
      return word[0];
    });
    return words.join("");
  }

  async createBank(settingsConfig, body) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside createBank`);

      body.id = uuidv4();
      body.abrivation = this.abrivation(body.bankName)
      console.log(body);
      const data = await bankConfig.model.create(body, { transaction: t });
      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getAllBanks(settingsConfig, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside getAllBanks`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: bankConfig.fieldMapping.id,
        bankName: bankConfig.fieldMapping.bankName,
        abrivation: bankConfig.fieldMapping.abrivation,
        bankTotal: bankConfig.fieldMapping.bankTotal,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      console.log(parseLimitAndOffset(queryParams))
      const data = await bankConfig.model.findAndCountAll({
        transaction: t,
        ...parseFilterQueries(queryParams, bankConfig.filters),
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

  async getBankById(settingsConfig, bankId, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside getUserById`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: bankConfig.fieldMapping.id,
        bankName: bankConfig.fieldMapping.bankName,
        abrivation: bankConfig.fieldMapping.abrivation,
        bankTotal: bankConfig.fieldMapping.bankTotal,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      const data = await bankConfig.model.findAll({
        ...parseFilterQueries(queryParams, bankConfig.filters, { id: bankId }),
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

  async updateBank(settingsConfig, bankId, body) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside updateBank`);

      let { newValue } = body;
      if(newValue==undefined){
        throw new Error("invalid parameter")
      }

      let up = await bankConfig.model.update(
        { bankName: newValue },
        { where: { id: bankId }, transaction: t }
      );
      let newAbrivation = this.abrivation(newValue);
      await bankConfig.model.update(
        { abrivation: newAbrivation },
        { where: { id: bankId }, transaction: t }
      );
      await t.commit();
      console.log(up);
      return up;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getBankTotal(settingsConfig, bankId) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside getBankTotal`);

      await this.updateBankTotal(settingsConfig, bankId)

      let myBank = await bankConfig.model.findAll({
        where: { id: bankId },
        attributes: ["bank_total"],
      });
      await t.commit();
      return myBank;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateBankTotal(settingsConfig, bankId) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[BankService] : Inside updateBankTotal`);

      let total = 0;
      let [myBank] = await bankConfig.model.findAll({
        transaction: t,
        where: { id: bankId },
        attributes: ["bank_total"],
        include: { model: accountConfig.model,as:"account", attributes: ["account_balance"] },
      });
      myBank.account.forEach((element) => {
        total = total + element.dataValues.account_balance;
      });
      let up = await bankConfig.model.update(
        { bankTotal: total },
        { where: { id: bankId }, transaction: t }
      );
      if ([up] == 0) {
        throw new Error("could not update Bank total");
      }
      let returnBank = await bankConfig.model.findAll({
        transaction: t,
        where: { id: bankId },
      });
      await t.commit();
      return returnBank;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  createAssociation(includeQuery, selectArray) {
    let associations = [];
    if (!Array.isArray(includeQuery)) {
      includeQuery = [includeQuery];
    }
    console.log(includeQuery)
    if (includeQuery?.includes(bankConfig.associations.accountFilter)) {
      associations.push(this.associationMap.account);
    }

    return associations;
  }
}
module.exports = BankService;
