const db = require("../../models")
const { validateStringLength } = require("../utils/string")
const { validateUuid } = require("../utils/uuid")
const { Op, Sequelize } = require("sequelize")
class TransactionConfig {
    constructor() {
        this.fieldMapping = Object.freeze(
            {
                id: "id",
                senderAccountId: "senderAccountId",
                receiverAccountId: "receiverAccountId",
                amount: "amount",
                currentBalance: "currentBalance",
                type: "type",
                accountId: "accountId",
                createdAt: "createdAt",
            }
        )
        this.model = db.transaction
        this.modelName = db.transaction.name
        this.tableName = db.transaction.tableName

        this.columnMapping = Object.freeze({
            id: this.model.rawAttributes[this.fieldMapping.id].field,
            senderAccountId: this.model.rawAttributes[this.fieldMapping.senderAccountId].field,
            receiverAccountId: this.model.rawAttributes[this.fieldMapping.receiverAccountId].field,
            amount: this.model.rawAttributes[this.fieldMapping.amount].field,
            currentBalance: this.model.rawAttributes[this.fieldMapping.currentBalance].field,
            type: this.model.rawAttributes[this.fieldMapping.type].field,
            accountId: this.model.rawAttributes[this.fieldMapping.accountId].field,
            createdAt: this.model.rawAttributes[this.fieldMapping.createdAt].field,
          })
   
        this.filters = Object.freeze({
            id: (id) => {
                validateUuid(id, "transaction config")
                return {
                    [this.fieldMapping.id]: {
                        [Op.eq]: id
                    }
                }
            },
            type: (type) => {
                validateStringLength(type, "type", undefined, 255)
                return {
                    [this.fieldMapping.type]: {
                        [Op.eq]: type
                    }
                }
            },
            createdAt: (createdAt) => {
                validateStringLength(createdAt, "createdAt", undefined, 255)
                return {
                    [this.fieldMapping.createdAt]: {
                        [Op.eq]: createdAt
                    }
                }
            },
        })

    }
}
const transactionConfig = new TransactionConfig()
// deepFreeze(transactionConfig)

module.exports = transactionConfig
