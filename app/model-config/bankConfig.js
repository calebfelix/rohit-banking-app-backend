const db = require("../../models")
const { validateStringLength } = require("../utils/string")
const { validateUuid } = require("../utils/uuid")
const { Op, Sequelize } = require("sequelize")
class BankConfig {
    constructor() {
        this.fieldMapping = Object.freeze(
            {
                id: "id",
                bankName: "bankName",
                abrivation: "abrivation",
                bankTotal: "bankTotal",
            }
        )
        this.model = db.bank
        this.modelName = db.bank.name
        this.tableName = db.bank.tableName

        this.columnMapping = Object.freeze({
            id: this.model.rawAttributes[this.fieldMapping.id].field,
            bankName: this.model.rawAttributes[this.fieldMapping.bankName].field,
            abrivation: this.model.rawAttributes[this.fieldMapping.abrivation].field,
            bankTotal: this.model.rawAttributes[this.fieldMapping.bankTotal].field,
          })
   
        this.filters = Object.freeze({
            id: (id) => {
                validateUuid(id, "user config")
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
                        [Op.eq]: bankName
                    }
                }
            },
        })

        this.associations = Object.freeze({
            accountFilter:'accountFilter',
        })
    }
}
const bankConfig = new BankConfig()
// deepFreeze(bankConfig)

module.exports = bankConfig
