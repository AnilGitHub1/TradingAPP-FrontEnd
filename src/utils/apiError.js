// apiError.js
export function parseApiError(error) {
  // axios error object normalization
  if (!error) return new Error("Unknown error");
  if (error.response && error.response.data) {
    // backend might return { message, errors }
    const d = error.response.data;
    const message = d.message || d.error || d.detail || JSON.stringify(d);
    const err = new Error(message);
    err.status = error.response.status;
    err.payload = d;
    return err;
  }
  if (error.message) return new Error(error.message);
  return new Error("Network error");
}
