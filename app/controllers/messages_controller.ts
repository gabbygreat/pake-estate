import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import FileUploadService from '#services/fileupload_service'
import { sendError, sendSuccess } from '../utils.js'
import Message from '#models/message'
import User from '#models/user'
import Property from '#models/property'

@inject()
export default class MessagesController {

    constructor(protected uploadService:FileUploadService){}

    public async handleFileUpload({ request,response }:HttpContext){
        try {
            const filesUploads = await this.uploadService.uploadFiles(request,'files','chat-files')
            const files:string[] = []
            const filesType:string[] = []
            filesUploads.forEach((e)=>{
                files.push(e.name)
                filesType.push(e.fileType)
            })
            //files.forEach((e)=>fileUploads.push({url:e.name, type: e.fileType}))
            return sendSuccess(response,{message:'File upload success', data: {files,filesType}})
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

    public async refUserData({ request, response}:HttpContext){
        try {
            const { id } = request.params()
            const user = await User.query().select(['firstname','lastname','profile_picture']).where('id','=',id)
            if(user){
                return sendSuccess(response,{data:{firstname: user[0].firstname, lastname:user[0].lastname, profile_picture:user[0].profile_picture}})
            }else{
                return sendSuccess(response,{data:{firstname:'', lastname:''}})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async refPropertyData({ request, response}:HttpContext){
        try {
            const { id } = request.params()
            const property = await Property.query().select(['property_title']).where('id','=',id)
            if(property){
                return sendSuccess(response,{data:{property_title: property[0].property_title}})
            }else{
                return sendSuccess(response,{data:{property_title:''}})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }
}