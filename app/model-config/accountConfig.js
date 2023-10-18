const db = require("../../models")
const { validateStringLength } = require("../utils/string")
const { validateUuid } = require("../utils/uuid")
const { Op, Sequelize } = require("sequelize")
class AccountConfig {
    constructor() {
        this.fieldMapping = Object.freeze(
            {
                id: "id",
                bankName: "bankName",
                accountBalance: "accountBalance",
                userId: "userId",
                bankId: "bankId",
            }
        )
        this.model = db.account
        this.modelName = db.account.name
        this.tableName = db.account.tableName

        this.columnMapping = Object.freeze({
            id: this.model.rawAttributes[this.fieldMapping.id].field,
            bankName: this.model.rawAttributes[this.fieldMapping.bankName].field,
            accountBalance: this.model.rawAttributes[this.fieldMapping.accountBalance].field,
            userId: this.model.rawAttributes[this.fieldMapping.userId].field,
            bankId: this.model.rawAttributes[this.fieldMapping.bankId].field,
          })
   
        this.filters = Object.freeze({
            id: (id) => {
                validateUuid(id, "account config")
                return {
                    [this.fieldMapping.id]: {
                        [Op.eq]: id
                    }
                }
            },
            bankName: (bankName) => {
                validateStringLength(bankName, "bankName", undefined, 255)
                return {
                    [this.fieldMapping.bankName]: {
                        [Op.like]: `%${bankName}%`
                    }
                }
            },
        })

        this.associations = Object.freeze({
            transactionFilter:'transactionFilter',
        })
    }
}
const accountConfig = new AccountConfig()
// deepFreeze(accountConfig)

module.exports = accountConfig
