const { StatusCodes } = require("http-status-codes")
const AccountService = require("../service/AccountService");
const BankService = require("../../bank/service/BankService");
const UserService = require("../../user/service/UserService");
const {isCurrentUser} = require("../../../middleware/authService")

class AccountController {
    constructor() {
        this.accountService = new AccountService()
        this.bankService = new BankService()
        this.userService = new UserService()
    }
 
    async createAccount(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[AccountController] : Inside createAccount`);

            isCurrentUser(settingsConfig, req, res, next)
            
            let {userId} = req.params
            let {bankId} = req.body

            validateUuid(userId)
            validateUuid(bankId)

            const bank = await this.bankService.getBankById(settingsConfig, bankId, req.query)
            if(bank.length == 0){
                throw new Error("Bank Not Found!")
            }
            const newAccount = await this.accountService.createAccount(settingsConfig,bank[0].dataValues.bankName,userId, req.body)
            await this.userService.updateNetWorth(settingsConfig, userId)
            await this.bankService.updateBankTotal(settingsConfig, bankId)
            res.status(StatusCodes.CREATED).json(newAccount)
            return
        } catch (error) {
            next(error)
        }
    }

    async getAllAccounts(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[AccountController] : Inside getAllAccounts`);

            isCurrentUser(settingsConfig, req, res, next)

            const queryParams = req.query
            const {userId} = req.params
            validateUuid(userId)
            const { count, rows } = await this.accountService.getAllAccounts(settingsConfig,userId, queryParams)
            res.set('X-Total-Count', count)
            res.status(StatusCodes.OK).json( rows )
            return
        } catch (error) {
            next(error)
        }
    }

    async getAccountById(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[AccountController] : Inside getAccountById`);

            isCurrentUser(settingsConfig, req, res, next)

            const {userId, accountId} = req.params
            validateUuid(userId)
            validateUuid(accountId)

            const user = await this.accountService.getAccountById(settingsConfig,userId,accountId,req.query)
            res.status(StatusCodes.OK).json(user)
            return
        } catch (error) {
            next(error)
        }
    }


}

module.exports = new AccountController()