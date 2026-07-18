const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function send(res, status, body) {
  return res.status(status).json(body);
}

export const respond = Object.freeze({
  ok(res, data) {
    return send(res, 200, { success: true, data });
  },

  created(res, data) {
    return send(res, 201, { success: true, data });
  },

  error(res, error, correlationId) {
    const payload = {
      code: error.code,
      message: error.expose ? error.message : GENERIC_ERROR_MESSAGE,
      correlationId,
    };

    if (error.fields) {
      payload.fields = error.fields;
    }

    return send(res, error.status, { success: false, error: payload });
  },
});
