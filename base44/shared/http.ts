// One place that turns an unexpected server fault into a response the client may see.
//
// Echoing error.message back to a caller leaks SDK, validation and storage internals — and
// checkIdentity / loginWithIdentifier run before sign-in exists, so anyone can trigger a 500
// and read the result. The real error is written to the function log instead, where only the
// app owner can see it.
export const serverError = (error, payload = { error: 'Something went wrong. Please try again.' }) => {
  console.error('[server-error]', error?.stack || error?.message || String(error));
  return Response.json(payload, { status: 500 });
};