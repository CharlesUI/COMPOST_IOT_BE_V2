const { UnAuthorizedError} = require("../errors/ErrorClass")
const jwt = require('jsonwebtoken')

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer')) {
        throw new UnAuthorizedError('UnAuthorized Attempt')
    }

    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        console.log("payload", payload)
        req.user = { adminId: payload.adminId, name: payload.username }
        next()
    } catch (error) {
        console.log(error)
    }
}

module.exports = authenticateAdmin