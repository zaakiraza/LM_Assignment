class ResponseHandler {


    success(
        res,
        data = null,
        message = "Success",
        statusCode = 200
    ) {

        return res.status(
            statusCode
        ).json({

            success: true,

            message,

            data

        });

    }


    error(
        res,
        message = "Something went wrong",
        statusCode = 500,
        data = null
    ) {

        return res.status(
            statusCode
        ).json({

            success: false,

            message,

            data

        });

    }

}


export default new ResponseHandler();