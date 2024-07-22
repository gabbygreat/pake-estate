import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import PropertyService, { DocumentationStages } from '#services/property_service'
import { sendError, sendSuccess } from '../utils.js'
import PropertyMedia from '#models/property_media'
export default class PropertiesController {
    constructor(
         protected uploadService:FileUploadService,
         protected propertyService:PropertyService
    ){}

    async composeProperty({request,response,auth}:HttpContext){
        try {
            const user = auth.use('api').user!
            const stage:DocumentationStages = request.input('documentation_stage')
            if(!stage) return sendError(response,{message:"Please specify documentation stage",code:400})
            switch(stage){
                case 'CONTACT_INFORMATION':
                    return this.propertyService.handlePropertyContact()
                case 'FEATURE':
                    return this.propertyService.handlePropertyFeature(request,response)
                case 'FINANCIAL_INFORMATION':
                    return this.propertyService.handleFinancialInformation(request,response)
                case 'LEGAL_INFORMATION':
                    return this.propertyService.handlePropertyLegalInfo()
                case 'MEDIA_INFORMATION':
                    return this.propertyService.handlePropertyMediaUpload()
                case 'PROPERTY_INFORMATION':
                    return this.propertyService.handlePropertyInformation(request,response,user.id)
                default:
                    return sendError(response,{message:"Nothing to do here!",code:400})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    async removePropertyMedia({request,response}:HttpContext){
        try {
            const { media_id} = request.params()
            const item = await PropertyMedia.find(media_id)
            if(item){
                try {
                    await this.uploadService.removeFile(item.media_url,"properties")
                } catch{}
                await item.delete()
                return sendSuccess(response,{message:"Media item removed"})
            }else{
                return sendError(response,{message:"Media item not found", code:404})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    async listPropertyMedia({request,response}:HttpContext){
        try {
            const { property_id } = request.params()
            const items = await PropertyMedia.query().select('*').where('property','=',property_id)
            return sendSuccess(response,{message:"Media items",data:items})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    async listProperties({request,response}:HttpContext){
        try {
            interface Filter {
                search?: string
                sort?:'recent'|'oldest'
                page?: number
                perPage?:number
            }
            const input:Filter = request.qs()
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }
}