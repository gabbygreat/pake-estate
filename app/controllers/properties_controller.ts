import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import PropertyService, { DocumentationStages } from '#services/property_service'
import { calculateBoundingBox, gisQuery, sendError, sendSuccess } from '../utils.js'
import PropertyMedia from '#models/property_media'
import Property from '#models/property'
import PropertyReview from '#models/property_review'
import { createReviewValidator } from '#validators/review'
import { inject } from '@adonisjs/core'

@inject()
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
                    return this.propertyService.handlePropertyLegalInfo(request,response)
                case 'MEDIA_INFORMATION':
                    return this.propertyService.handlePropertyMediaUpload(request,response)
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
                forReview?:boolean,
                sort?:'recent'|'oldest'
                page?: number
                perPage?:number,
                latitude?:number,
                longitude?:number
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
            if(input.forReview){
                query.orderBy('total_reviews', 'desc')
            }
            if(input.sort){
                query.orderBy('created_at', input.sort === 'oldest' ? 'asc' : 'desc')
            }

            if(input.latitude && input.longitude){
                const {maxLat,maxLng,minLat,minLng} = calculateBoundingBox(input.latitude,input.longitude,5)//5KM AREA
                const locationQuery = gisQuery({
                    startLatitude:minLat,
                    startLongitude:minLng,
                    stopLatitude:maxLat,
                    stopLongitude:maxLng
                })
                query.andWhere((q)=>{q.whereRaw(locationQuery)})
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
            return sendSuccess(response,{data:data[0],message:"Property information"})
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
            await request.validateUsing(createReviewValidator)
            const isDraft = await Property.query().select(['current_state']).where('id','=',property_id)
            if(isDraft[0] && isDraft[0].current_state === 'draft'){
                return sendError(response,{message:"Property has not been published", code:400})
            }
            const data:Partial<PropertyReview> = {
                property:property_id,
                rating,
                review,
                user_id:user?.id
            }
            await PropertyReview.updateOrCreate({user_id:user?.id,property:property_id},data)
            await this.propertyService.updateRatingandReview(property_id)
            return sendSuccess(response,{message:"Review submitted",})
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }

    public async propertyReviewSummary({request,response}:HttpContext){
        try {
            const { page,perPage,property_id } = request.qs()
            let property = await Property.find(property_id)
            const ratings = [1,2,3,4,5]
            const frequency = Array(ratings.length).fill(0)
            for(let i=0; i < ratings.length; i++){
                const total = await PropertyReview.query().count('id','total').whereRaw('property = ? AND rating = ?',[property_id,ratings[i]])
                frequency[i] = total[0].$extras.total
            }
            const reviews = await PropertyReview.query()
            .select('*')
            .preload('userData',(user)=>{
                user.select(['firstname','lastname'])
            })
            .where('property','=',property_id)
            .orderBy('created_at','desc')
            .paginate(page ?? 1,perPage ?? 1)

            return sendSuccess(response,{message:"Review summary",data:{
                property,
                reviewSummary:{ratings,frequency},
                reviews
            }})
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }

    public async topSellingProperties({request,auth,response}:HttpContext){
        try {
            interface Filter{
                page?: number
                perPage?:number
                start_date?:string
                end_date?:string,
                for_user?:boolean
            }
            const input:Filter = request.qs()
            const properties = Property.query().select(['id','property_title','ask_price','general_rent_fee','total_purchases'])
            .where('property_type','!=','')
            if(input.for_user){
                const user = await auth.use('api').authenticate()
                properties.where('owner_id','=',user?.id!)
            }
            const results = await properties.orderBy('total_purchases','desc').paginate(input.page ?? 1, input.perPage ?? 10)
            return sendSuccess(response,{message:"Top Selling properties", data:results})
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }

    public async publishProperty({request,auth,response}:HttpContext){
        try {
            const user = auth.use('api').user
            const { property_id } = request.body()
            const property = await Property.find(property_id)
            if(property && user){
                if(property.owner_id != user.id){
                    return sendError(response,{message:"You cannot publish this property", code:403})
                }
                property.current_state = 'published'
                await property.save()
                return sendSuccess(response,{message:"Property is live"})
            }else{
                return sendError(response,{message:"Property not found", code:404})
            }
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }
    
    public async hideProperty({request,auth,response}:HttpContext){
        try {
            const { id } = request.params()
            const owner_id = auth.use('api').user?.id
            const property = await Property.find(id)
            if(property){
                if(property.owner_id !== owner_id){
                    return sendError(response,{message:"You cannot perform this operation", code:403}) 
                }
                property.current_state = 'draft'
                await property.save()
                return sendSuccess(response,{message:'Property status updated'})
            }else{
                return sendError(response,{message:'Property not found', code:404})
            }
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }
}