export function extractApiError(error) {
  const responseData = error?.response?.data;

  if (!responseData) {
    return null;
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData.error?.message) {
    return responseData.error.message;
  }

  if (responseData.message) {
    return responseData.message;
  }

  if (responseData.error_description) {
    return responseData.error_description;
  }

  if (responseData.error) {
    return responseData.error;
  }

  return null;
}
