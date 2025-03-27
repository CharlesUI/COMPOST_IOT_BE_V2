const { StatusCodes } = require('http-status-codes')

const errorHandlerMiddleware = (err, req, res, next) => {
    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || "Something went wrong..."
    }

    //ERROR FOR BAD REQUEST
    if(err.name === "ValidationError") {
        customError.statusCode = StatusCodes.BAD_REQUEST
        customError.message = Object.values(err.errors).map(err => err.message).join(" || ")
    }

    //ERROR FOR NOT FOUND
    if(err.name === "CastError") {
        customError.statusCode = StatusCodes.NOT_FOUND
        customError.message = `Not item found with ID ${err.value}`
    }

    //ERROR FOR DUPLICATE ACCESS || UPDATE
    if(err.code && err.code === 11000) {
        customError.statusCode = StatusCodes.BAD_REQUEST
        customError.message = `Duplicate error for user ${Object.keys(err.keyValue)}, please try again...`
    }

    //RETURN ERROR
    return res.status(customError.statusCode).json({message: customError.message})
}

module.exports = errorHandlerMiddleware