const userConfig = require("../../../model-config/userConfig");
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
const transactionConfig = require("../../../model-config/transactionConfig");

class UserService {
  constructor() {}

  associationMap = {
    account: {
      model: accountConfig.model,
      as: "account",
      include:{
        model: transactionConfig.model,
        as: "transaction"
      }
    },
  };

  async createUser(settingsConfig, body) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside createUser`);

      let hashedPassword = await bcrypt.hash(body.password, 12);
      body.id = uuidv4();
      body.isAdmin = false;
      body.password = hashedPassword;
      console.log(body);
      const data = await userConfig.model.create(body, { transaction: t });
      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getAllUsers(settingsConfig, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside getAllUsers`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: userConfig.fieldMapping.id,
        name: userConfig.fieldMapping.name,
        age: userConfig.fieldMapping.age,
        gender: userConfig.fieldMapping.gender,
        username: userConfig.fieldMapping.username,
        netWorth: userConfig.fieldMapping.netWorth,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      const data = await userConfig.model.findAndCountAll({
        transaction: t,
        ...parseFilterQueries(queryParams, userConfig.filters),
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

  async getUserById(settingsConfig, userId, queryParams) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside getUserById`);

      const includeQuery = queryParams.include || [];
      let associations = [];
      const attributesToReturn = {
        id: userConfig.fieldMapping.id,
        name: userConfig.fieldMapping.name,
        age: userConfig.fieldMapping.age,
        gender: userConfig.fieldMapping.gender,
        username: userConfig.fieldMapping.username,
        netWorth: userConfig.fieldMapping.netWorth,
      };
      let selectArray = parseSelectFields(queryParams, attributesToReturn);
      if (!selectArray) {
        selectArray = Object.values(attributesToReturn);
      }
      if (includeQuery) {
        associations = this.createAssociation(includeQuery, selectArray);
      }
      // console.log(">>>>>>>>>>>",parseFilterQueries(queryParams, userConfig.filters,{id:userId}))
      const data = await userConfig.model.findAll({
        ...parseFilterQueries(queryParams, userConfig.filters, { id: userId }),
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

  async updateUser(settingsConfig, userId, body) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside updateUser`);

      let { parameter, newValue } = body;
      let up = undefined;
      switch (parameter) {
        case "name":
          up = await userConfig.model.update(
            { name: newValue },
            { where: { id: userId }, transaction: t }
          );
          await t.commit();
          return up;
        case "age":
          up = await userConfig.model.update(
            { age: newValue },
            { where: { id: userId }, transaction: t }
          );
          await t.commit();
          return up;
        case "gender":
          up = await userConfig.model.update(
            { gender: newValue },
            { where: { id: userId }, transaction: t }
          );
          await t.commit();
          return up;
        default:
          throw new Error("Invalid Parameter");
      }
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getNetworth(settingsConfig, userId) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside getNetworth`);

      await this.updateNetWorth(settingsConfig, userId)

      let myUser = await userConfig.model.findAll({
        where: { id: userId },
        attributes: ["net_worth"],
      });
      await t.commit();
      return myUser;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateNetWorth(settingsConfig, userId) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside updateNetWorth`);

      let total = 0;
      let [myUser] = await userConfig.model.findAll({
        transaction: t,
        where: { id: userId },
        attributes: ["net_worth"],
        include: { model: accountConfig.model,as:"account", attributes: ["account_balance"] },
      });
      myUser.account.forEach((element) => {
        total = total + element.dataValues.account_balance;
      });
      let up = await userConfig.model.update(
        { netWorth: total },
        { where: { id: userId }, transaction: t }
      );
      if ([up] == 0) {
        throw new Error("could not update networth");
      }
      let returnUser = await userConfig.model.findAll({
        transaction: t,
        where: { id: userId },
      });
      await t.commit();
      return returnUser;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getUserByUsername(settingsConfig, username) {
    const t = await startTransaction();
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside getUserByUsername`);

      const data = await userConfig.model.findAll({
        transaction: t,
        where: { username: username },
      });
      await t.commit();
      return data;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async authenticateUser(settingsConfig, username, password) {
    try {
      const logger = settingsConfig.logger;
      logger.info(`[UserService] : Inside authenticateUser`);

      let [myUser] = await this.getUserByUsername(settingsConfig, username);
      if (myUser == undefined) {
        throw new Error("user Not Found");
      }

      let check = await bcrypt.compare(password, myUser.dataValues.password);
      if (!check) {
        throw new Error("authentication failed");
      }

      let myobj = {
        userId: myUser.dataValues.id,
        username: myUser.dataValues.username,
        isAdmin: myUser.dataValues.isAdmin,
      };
      let token = jwt.sign(myobj, process.env.JWT_SECRET_KEY, {
        expiresIn: 60 * 60,
      });

      return token;
    } catch (error) {
      throw error;
    }
  }

  createAssociation(includeQuery, selectArray) {
    let associations = [];
    if (!Array.isArray(includeQuery)) {
      includeQuery = [includeQuery];
    }
    if (includeQuery?.includes(userConfig.associations.accountFilter)) {
      associations.push(this.associationMap.account);
    }

    return associations;
  }
}
module.exports = UserService;
