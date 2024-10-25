import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import FileUploadService from '#services/fileupload_service'
import { sendError, sendSuccess } from '../utils.js'
import Message from '#models/message'

@inject()
export default class MessagesController {

    constructor(protected uploadService:FileUploadService){}

    public async handleFileUpload({ request,response }:HttpContext){
        try {
            const files = await this.uploadService.uploadFiles(request,'files','chat-files')
            const fileUploads:{url:string,type:string}[] = []
            files.forEach((e)=>fileUploads.push({url:e.name, type: e.fileType}))
            return sendSuccess(response,{message:'File upload success', data: fileUploads})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async removeFile({ request, auth, response }:HttpContext){
        try {
            const actor = auth.use('api').user!
            const { chat_id, file_name } = request.params()
            const chat = await Message.query().select('*').where('id','=',chat_id).andWhere((q)=>q.whereRaw("sender_id = ? OR receiver_id = ?",[Array(2).fill(actor.id)]))
            if(chat[0]){
                const index = chat[0].files.indexOf(file_name)
                if(index >= 0){
                    try {
                        await this.uploadService.removeFile(file_name)
                    } catch{/** */}
                    (chat[0].files as unknown as string[]) = (chat[0].files as unknown as string[]).filter((e)=>e !== file_name)
                    await chat[0].save()
                    return sendSuccess(response,{message:"File removed"})
                }else{
                    return sendError(response,{message:"Delete operation failed", code:400})
                }
            }else{
                return sendError(response,{message:"Delete operation failed", code:403})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }
}