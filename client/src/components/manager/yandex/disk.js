import axios from "axios";

const YANDEX_OAUTH_TOKEN = "y0__xDMrvrRBxi6wzYg8YSh1xKGBf-HVkjR-U7LaXQCG5THY9TIRQ";

export const getYandexDiskFileUrl = async (filePath) => {
  try {
    const response = await axios.get("https://cloud-api.yandex.net/v1/disk/resources/download", {
      headers: {
        Authorization: `OAuth ${YANDEX_OAUTH_TOKEN}`,
      },
      params: {
        path: filePath,
      },
    });

    return response.data.href;
  } catch (error) {
    console.error("Ошибка при получении ссылки на файл:", error);
    return null;
  }
};
