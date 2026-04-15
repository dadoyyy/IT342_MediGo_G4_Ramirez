export const authResponseAdapter = {
  extractToken(response) {
    return response?.data?.data?.token ?? null;
  },

  extractApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error?.message ?? fallbackMessage;
  },
};
