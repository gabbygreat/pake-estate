import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import PropertyService, { DocumentationStages } from '#services/property_service'
import { sendError, sendSuccess } from '../utils.js'
import PropertyMedia from '#models/property_media'
import Property from '#models/property'
import PropertyReview from '#models/property_review'
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
                owner?:boolean //IF THIS IS OWNER,FETCH BOTH PUBLISHED AND UNPUBLISHED ELSE FETCH ONLY PUBLISHED
                search?: string
                sort?:'recent'|'oldest'
                page?: number
                perPage?:number
            }
            const input:Filter = request.qs()
            const query = Property.query()
            .select('*')
            .where('property_title','!=',"")
            .preload('mediaItems',(media)=>{
                media.select(['id','media_url','media_type'])
            })
            if(input.search){
                query.andWhere((q)=>{
                    q.whereRaw('property_title % ? OR property_description % ?',Array(2).fill(input.search))
                })
            }
            
            !input.owner ? query.andWhere('current_state','=','published') : (()=>{})()

            if(input.sort){
                query.orderBy('created_at', input.sort === 'oldest' ? 'asc' : 'desc')
            }
            const data = await query.paginate(input.page ?? 1, input.perPage ?? 20)
            return sendSuccess(response,{message:"Property listing", data})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async propertyInfo({request,response}:HttpContext){
        try {
            const {id} = request.params()
            const data = await Property.query().select('*')
            .preload('amenities',(am)=>{
                am.select(['id','name'])
            })
            // .preload('documents',(dc)=>{
            //     dc.select('*')
            // })
            .preload('fees',(fee)=>{
                fee.select(['id','name','amount'])
            })
            .preload('legalRequirements',(legalDoc)=>{
                legalDoc.select('*')
            })
            .preload('owner',(owner)=>{
                owner.select('*') //TODO:OPTIMIZE
            })
            .preload('utilities',(utility)=>{
                utility.select('*')
            })
            .preload('mediaItems',(media)=>{
                media.select(['id',"media_url","media_type"])
            }).where('id','=',id)
           if(data){
            return sendSuccess(response,{data,message:"Property information"})
           }else{
            return sendError(response,{message:"Property not found",code:404})
           }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async submitReview({request,response,auth}:HttpContext){
        try {
            const user = auth.use('api').user
            const { review, rating, property_id} = request.body()
            const data:Partial<PropertyReview> = {
                property:property_id,
                rating,
                review,
                user_id:user?.id
            }
            await PropertyReview.updateOrCreate(data,data)
            
        } catch (error) {
            
        }
    }
}