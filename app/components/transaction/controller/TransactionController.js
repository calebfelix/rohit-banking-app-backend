const { StatusCodes } = require("http-status-codes");
const TransactionService = require("../service/TransactionService");
const UserService = require("../../user/service/UserService");
const BankService = require("../../bank/service/BankService");
const AccountService = require("../../account/service/AccountService");
const {isCurrentUser} = require("../../../middleware/authService");
const { validateUuid } = require("../../../utils/uuid");


class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.bankService = new BankService();
    this.accountService = new AccountService();
  }

  async depositAmount(settingsConfig, req, res, next) {
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionController] : Inside depositAmount`);

      isCurrentUser(settingsConfig, req, res, next)

      let userId = req.params.userId;
      let accountId = req.params.accountId;

      validateUuid(userId)
      validateUuid(accountId)

      let amount = req.body.amount;
      if (amount < 0) {
        throw new Error("invalid Amount");
      }

      let tran = await this.transactionService.depositAmount(
        settingsConfig,
        accountId,
        amount
      );
      await this.userService.updateNetWorth(settingsConfig, userId);
      await this.bankService.updateBankTotal(settingsConfig, tran.myBankId);

      res.status(StatusCodes.CREATED).json(tran);
      return;
    } catch (error) {
      next(error);
    }
  }

  async withdrawAmount(settingsConfig, req, res, next) {
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionController] : Inside withdrawAmount`);

      isCurrentUser(settingsConfig, req, res, next)

      let userId = req.params.userId;
      let accountId = req.params.accountId;
      validateUuid(userId)
      validateUuid(accountId)


      let amount = req.body.amount;
      if (amount < 0) {
        throw new Error("invalid Amount");
      }

      let tran = await this.transactionService.withdrawAmount(
        settingsConfig,
        accountId,
        amount
      );
      await this.userService.updateNetWorth(settingsConfig, userId);
      await this.bankService.updateBankTotal(settingsConfig, tran.myBankId);

      res.status(StatusCodes.CREATED).json(tran);
      return;
    } catch (error) {
      next(error);
    }
  }

  async transferAmount(settingsConfig, req, res, next) {
    try {
      const logger = settingsConfig.logger;
      logger.info(`[TransactionController] : Inside transferAmount`);

      isCurrentUser(settingsConfig, req, res, next)

      let userId = req.params.userId;
      let accountId = req.params.accountId;

      validateUuid(userId)
      validateUuid(accountId)

      let { transferAmount, receiverAccountId } = req.body;
      if (transferAmount < 0) {
        throw new Error("invalid Amount");
      }

      let tran = await this.transactionService.transferAmount(
        settingsConfig,
        accountId,
        receiverAccountId,
        transferAmount
      );
      await this.userService.updateNetWorth(settingsConfig, tran.senderUserId);
      await this.userService.updateNetWorth(settingsConfig, tran.receiverUserId);
      await this.bankService.updateBankTotal(settingsConfig, tran.senderBankId);
      await this.bankService.updateBankTotal(settingsConfig, tran.receiverBankId);

      res.status(StatusCodes.CREATED).json({
          senderTransaction: tran.senderTransaction,
          receiverTransaction: tran.receiverTransaction,
        });
      return;
    } catch (error) {
      next(error);
    }
  }

  async getPassbook(settingsConfig, req, res, next) {
      try {
          const logger = settingsConfig.logger;
          logger.info(`[TransactionController] : Inside getPassbook`);

      isCurrentUser(settingsConfig, req, res, next)


          let {accountId} = req.params
      validateUuid(accountId)
          let queryParams = req.params
          const { count, rows } = await this.transactionService.getPassbook(settingsConfig,accountId,queryParams)
          res.set('X-Total-Count', count)
          res.status(StatusCodes.OK).json( rows )
          return
      } catch (error) {
          next(error)
      }
  }

}

module.exports = new TransactionController();
