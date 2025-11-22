import { apiClient } from "./httpClient";

const AVATAR_UPLOAD_ENDPOINT = "/upload";
const AVATAR_DELETE_ENDPOINT = "/delete";
const PROFILE_PHOTO_UPLOAD_ENDPOINT = "/api/profile-photos/upload";
const PROFILE_PHOTO_DELETE_ENDPOINT = "/api/profile-photos";

function asMultipart() {
  return {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("File", file);
  
  const response = await apiClient.post(
    AVATAR_UPLOAD_ENDPOINT,
    formData,
    asMultipart()
  );

  let url = "";
  
  if (typeof response.data === "string") {
    url = response.data.trim();
  } else if (response.data && typeof response.data === "object") {
    url = response.data.url || 
          response.data.fileUrl || 
          response.data.avatarUrl || 
          response.data.path ||
          response.data.filePath ||
          "";
    
    if (url) {
      url = String(url).trim();
    }
  }
  
  if (!url) {
    throw new Error("Server did not return a valid URL");
  }
  
  return url;
}

export async function deleteAvatar(fileName) {
  if (!fileName) return;
  await apiClient.delete(AVATAR_DELETE_ENDPOINT, {
    params: { fileName },
  });
}

export async function uploadProfilePhoto(file, userProfileId) {
  const formData = new FormData();
  if (userProfileId) {
    formData.append("UserProfileId", userProfileId);
  }
  formData.append("File", file);

  const { data } = await apiClient.post(
    PROFILE_PHOTO_UPLOAD_ENDPOINT,
    formData,
    asMultipart()
  );

  return data;
}

export async function deleteProfilePhoto(profilePhotoId) {
  if (!profilePhotoId) return;
  await apiClient.delete(`${PROFILE_PHOTO_DELETE_ENDPOINT}/${profilePhotoId}`);
}
