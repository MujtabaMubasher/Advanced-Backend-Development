
const asyncHandler = (requestHandler) => {
 return (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch((error) => {
    return next(error);
  });
};
}

export {asyncHandler}


/**--------------------------------------------- */

                        //OR


// const asyncHandler = (fn)=> {

//     return  async (req, res, next) => {

//         try {

//             await fn(req, res, next);

//         } catch (error) {
           
//             res.status(error.code || 500).json({
//                 success:false,
//                 message: error.message
//             })
//         }
        
//     }

// }


/**--------------------------------------------- */

                        //OR

// const asyncHandler = (fn) => { // Define a function named asyncHandler that takes one argument, `fn`.
//     return async (req, res, next) => { // Return an asynchronous function that takes three arguments: `req`, `res`, and `next`.

//         try { // Begin a try-catch block to handle potential errors.

//             await fn(req, res, next); // Await the execution of the provided asynchronous function `fn` with the given `req`, `res`, and `next` parameters.

//         } catch (error) { // If an error occurs during the execution of `fn`, catch it and handle it here.

//             res.status(error.code || 500).json({ // Set the HTTP response status code based on the `code` property of the error, defaulting to 500 (Internal Server Error) if not provided.
//                 success: false, // Indicate that the operation was not successful.
//                 message: error.message // Provide the error message in the response body.
//             });
//         }
//     };
// };



                        

