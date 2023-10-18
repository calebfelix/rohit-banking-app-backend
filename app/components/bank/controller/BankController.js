const { StatusCodes } = require("http-status-codes")
const BankService = require("../service/BankService");

class BankController {
    constructor() {
        this.bankService = new BankService()
    }
 
    async createBank(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[BankController] : Inside createBank`);
            
            const newBank = await this.bankService.createBank(settingsConfig, req.body)
            res.status(StatusCodes.CREATED).json(newBank)
            return
        } catch (error) {
            next(error)
        }
    }

    async getAllBanks(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[BankController] : Inside getAllBanks`);

            const queryParams = req.query
            const { count, rows } = await this.bankService.getAllBanks(settingsConfig,queryParams)
            res.set('X-Total-Count', count)
            res.status(StatusCodes.OK).json( rows )
            return
        } catch (error) {
            next(error)
        }
    }

    async getBankById(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[BankController] : Inside getBankById`);

            const {bankId} = req.params
            validateUuid(bankId)

            const user = await this.bankService.getBankById(settingsConfig,bankId,req.query)
            res.status(StatusCodes.OK).json(user)
            return
        } catch (error) {
            next(error)
        }
    }

    async updateBank(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[BankController] : Inside updateBank`);
            
            const {bankId} = req.params
            validateUuid(bankId)
            const bank = await this.bankService.getBankById(settingsConfig, bankId, req.query)
            if(bank.length == 0){
                throw new Error("Bank Not Found!")
            }

            const [bankUpdated] = await this.bankService.updateBank(settingsConfig,bankId, req.body)
            if(bankUpdated==0){
                throw new Error("Could Not Update Bank")
            }
            res.status(StatusCodes.OK).json("Bank Updated")
            return
        } catch (error) {
            next(error)
        }
    }

    async getBankTotal(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[BankController] : Inside getBankTotal`);
            
            const {bankId} = req.params
            validateUuid(userId)

            const bank = await this.bankService.getBankById(settingsConfig, bankId, req.query)
            if(bank.length == 0){
                throw new Error("Bank Not Found!")
            }

            let bankTotal = await this.bankService.getBankTotal(settingsConfig, bankId, req.query)

            res.status(StatusCodes.OK).json(bankTotal)
            return
        } catch (error) {
            next(error)
        }
    }

}

module.exports = new BankController()