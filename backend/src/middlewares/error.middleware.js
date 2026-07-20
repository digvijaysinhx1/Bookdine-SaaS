export default (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = statusCode < 500;

  if (!isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (isOperational ? "REQUEST_FAILED" : "INTERNAL_SERVER_ERROR"),
      message: isOperational
        ? err.message
        : "Internal Server Error",
    },
  });
};
