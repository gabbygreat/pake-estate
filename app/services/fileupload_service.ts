import env from '#start/env'
import { Request } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import { timestamp } from '../utils.js';
import { unlink } from 'fs/promises';
export default class FileUploadService {

    private websiteuRL = process.env.NODE_ENV === 'production'
  ? env.get('WEBSITE_API_URL')
  : `http://localhost:${process.env.PORT}`;

   
  async uploadStaticMediaFiles(
    request: Request,
    clientName: string,
    destination: string
  ) {
    try {
      let nm = `${request.input("name")}.png`;
      nm = nm.replace(/\s/g, "").replace(/[,:]/g, "-");
      const file = request.file(clientName);
  
      if (file) {
        await file.move(app.makePath(`../${destination}`), { name: nm });
        const fileUrl = `/uploads/${destination}/${nm}`//await Drive.getUrl(`${destination}/${nm}`);
        return `${this.websiteuRL}${fileUrl}`;
      } else {
        return "";
      }
    } catch (e) {
      throw Error("File upload failed!");
    }
  }



  async uploadFiles(
    request: Request,
    clientFormName: string,
    destination: string
  ): Promise<
    Array<{
      name: string;
      fileType: string;
    }>
  > {
    try {
      const fileKeys: Array<{ name: string; fileType: string }> = [];
      const files = request.files(clientFormName);
  
      for (const file of files) {
        let newName = `${timestamp()}_${file.clientName}`;
        newName = newName.replace(/\s/g, "").replace(/[,:]/g, "-");
        await file.move(app.makePath(`../${destination}`), { name: newName });
        const fileUrl = `/uploads/${destination}/${newName}`//await Drive.getUrl(`${destination}/${newName}`);
        fileKeys.push({
          name: `${this.websiteuRL}${fileUrl}`,
          fileType: file.type!,
        });
      }
      return fileKeys;
    } catch (error) {
      throw Error("File upload failed!");
    }
  }



async removeFile(fileName: string, destination?: string) {
    const fileKey = this.getFileKey(fileName);
    await unlink(app.makePath(`../${destination}/${fileKey}`))
  }
  
 getFileKey(url: string) {
    return url.split("/").pop();
  }
  
getFolderPath(url: string) {
    const urlParts = url.split("/");
  
    // Remove the last component (file name) from the URL
    const folderPath = urlParts.slice(0, -1).join("/");
  
    return folderPath;
  }

}