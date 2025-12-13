async function getWebdavClient() {
    const { createClient } = await import('webdav');
    return createClient;
  }
  
  class FileService {
    constructor() {
      this.client = null;
      this.baseFolder = '/AfishaApp/Shows';
      this.actorFoldrer = '/AfishaApp/Shows/Actors';
    }
  
    async init() {
      const createClient = await getWebdavClient();
      this.client = createClient('https://webdav.yandex.ru/', {
        username: 'gritskevitchstefania',
        password: 'hiycerayccrhrtmy'
      });
    }
  
    async ensureFolderExists() {
      if (!this.client) await this.init();
      try {
        await this.client.stat(this.baseFolder);
      } catch {
        await this.client.createDirectory(this.baseFolder);
      }
    }

    async ensureFolderActorExists() {
      if (!this.client) await this.init();
      try {
        await this.client.stat(this.actorFoldrer);
      } catch {
        await this.client.createDirectory(this.actorFoldrer);
      }
    }
  
  
    async uploadFile(localFilePath, remoteFileName) {
      await this.ensureFolderExists();
  
      const remoteFilePath = `${this.baseFolder}/${remoteFileName}`;
      const fs = require('fs');
      const fileStream = fs.createReadStream(localFilePath);
  
      await this.client.putFileContents(remoteFilePath, fileStream, { overwrite: true });
  
      console.log(`Файл загружен: ${remoteFilePath}`);
      return `https://webdav.yandex.ru${remoteFilePath}`;
    }

    async uploadFileActor(localFilePath, remoteFileName) {
      await this.ensureFolderExists();
  
      const remoteFilePath = `${this.actorFoldrer}/${remoteFileName}`;
      const fs = require('fs');
      const fileStream = fs.createReadStream(localFilePath);
  
      await this.client.putFileContents(remoteFilePath, fileStream, { overwrite: true });
  
      console.log(`Файл загружен: ${remoteFilePath}`);
      return `https://webdav.yandex.ru${remoteFilePath}`;
    }
  }


  

  
  
  module.exports = new FileService();
  