const { StatusCodes } = require("http-status-codes")
const UserService = require("../service/UserService");

class UserController {
    constructor() {
        this.userService = new UserService()
    }

    async login(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside login`);
            
            const { username, password } = req.body;
            const token = await this.userService.authenticateUser(settingsConfig,username, password);
            res.cookie(process.env.AUTH_COOKIE_NAME, token);
            res.status(StatusCodes.OK).json("Login Done")
        } catch (error) {
            next(error)
        }
    }

    async logout(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside logout`);
            
            res.cookie(process.env.AUTH_COOKIE_NAME,"", {expires: new Date(Date.now())});
            res.status(StatusCodes.OK).json("Logged out")
        } catch (error) {
            next(error)
        }
    }
    
    async createUser(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside createUser`);
            
            const user = await this.userService.getUserByUsername(settingsConfig, req.body.username)
            if(user.length != 0){
                throw new Error("username Already Taken")
            }
            const newUser = await this.userService.createUser(settingsConfig, req.body)
            
            res.status(StatusCodes.CREATED).json(newUser)
            return
        } catch (error) {
            next(error)
        }
    }

    async getAllUsers(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside getAllUsers`);

            const queryParams = req.query
            const { count, rows } = await this.userService.getAllUsers(settingsConfig,queryParams)
            res.set('X-Total-Count', count)
            res.status(StatusCodes.OK).json( rows )
            return
        } catch (error) {
            next(error)
        }
    }

    async getUserById(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside getUserById`);

            const {userId} = req.params
            const user = await this.userService.getUserById(settingsConfig,userId,req.query)
            res.status(StatusCodes.OK).json(user)
            return
        } catch (error) {
            next(error)
        }
    }

    async updateUser(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside updateUser`);
            
            const {userId} = req.params
            const user = await this.userService.getUserById(settingsConfig, userId, req.query)
            if(user.length == 0){
                throw new Error("User Not Found!")
            }

            const [userUpdated] = await this.userService.updateUser(settingsConfig,userId, req.body)
            if(userUpdated==0){
                throw new Error("Could Not Update user")
            }
            res.status(StatusCodes.OK).json("User Updated")
            return
        } catch (error) {
            next(error)
        }
    }

    async getNetworth(settingsConfig, req, res, next) {
        try {
            const logger = settingsConfig.logger;
            logger.info(`[UserController] : Inside getNetworth`);
            
            const {userId} = req.params
            validateUuid(userId)

            const user = await this.userService.getUserById(settingsConfig, userId, req.query)
            if(user.length == 0){
                throw new Error("User Not Found!")
            }

            let networth = await this.userService.getNetworth(settingsConfig, userId, req.query)

            res.status(StatusCodes.OK).json(networth)
            return
        } catch (error) {
            next(error)
        }
    }

}

module.exports = new UserController()