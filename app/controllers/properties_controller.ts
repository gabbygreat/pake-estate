import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import PropertyService, { DocumentationStages } from '#services/property_service'
import { sendError } from '../utils.js'
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

    async addPropertyMedia(){
        try {
            
        } catch (error) {
            
        }
    }

    async removePropertyMedia(){
        try {
            
        } catch (error) {
            
        }
    }

    async listPropertyMedia(){
        try {
            
        } catch (error) {
            
        }
    }
}