/**
 * Wraps an asynchronous function (controller) and automatically catches any errors, 
 * passing them to Express's global error handler (via next(err)).
 * This eliminates the need for try/catch blocks in every async route handler.
 * @param {Function} fn - The asynchronous controller function (req, res, next) => Promise<void>.
 * @returns {Function} An Express route handler.
 */
const catchAsync = fn => {
  return (req, res, next) => {
    // Execute the function and catch any promise rejection (error)
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;