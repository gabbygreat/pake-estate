/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import PropertyService, { DocumentationStages } from '#services/property_service'
import { calculateBoundingBox, gisQuery, sendError, sendSuccess } from '../utils.js'
import PropertyMedia from '#models/property_media'
import Property from '#models/property'
import PropertyReview from '#models/property_review'
import { createReviewValidator } from '#validators/review'
import { inject } from '@adonisjs/core'
import PropertyLegalRequirement from '#models/property_legal_requirement'
import PropertyTenant from '#models/property_tenant'
import SavedProperty from '#models/saved_property'
import LoginService from '#services/login_service'

@inject()
export default class PropertiesController {
    constructor(
         protected uploadService:FileUploadService,
         protected propertyService:PropertyService,
         protected loginService: LoginService
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
                } catch{/** */}
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


    async listProperties({request,auth,response}:HttpContext){
        try {
            interface Filter {
                owner?:boolean|string //IF THIS IS OWNER,FETCH BOTH PUBLISHED AND UNPUBLISHED ELSE FETCH ONLY PUBLISHED
                search?: string
                forReview?:boolean|string,
                sort?:'recent'|'oldest'
                page?: number
                perPage?:number,
                latitude?:number,
                longitude?:number,
                bedrooms?:number,
                bathrooms?:number,
                maxPrice?:number,
                minPrice?:number
                location?:string
                propertyType?:string
                listingType?:'sale'|'rent',
                currency?:string
            }
            const input:Filter = request.qs()
            const query = Property.query()
            .select('*')
            .where('property_title','!=',"")
            .preload('mediaItems',(media)=>{
                media.select(['id','media_url','media_type'])
            })
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
            })
            if(input.search){
                console.log('currency')
                query.andWhere((q)=>{
                    q.whereRaw('property_title % ? OR property_description % ?',Array(2).fill(input.search))
                })
            }
            
            if(input.owner && (input.owner === true || input.owner === 'true')){
                const user = await auth.authenticate()
                query.andWhere('owner_id','=',user.id)
            }else{
                query.andWhere('current_state','=','published').andWhere('hidden','=',false)
            }

            if(input.forReview && (input.forReview === true || input.forReview === 'true')){
                query.orderBy('total_reviews', 'desc')
            }
            if(input.listingType){
                query.andWhere('listing_type','=',input.listingType)
            }
            if(input.bedrooms && input.bedrooms !== null && input.bedrooms !== 'undefined' as any && input.bedrooms !== undefined){
                if(input.bedrooms == 5){
                    query.andWhere('bedrooms','>=',input.bedrooms)
                }else{
                    query.andWhere('bedrooms','=',input.bedrooms)
                }
            }
            if(input.bathrooms && input.bedrooms !== null && input.bedrooms !== 'undefined' as any && input.bedrooms !== undefined){
                query.andWhere('bathrooms','=',input.bathrooms)
            }
            if(input.minPrice && !isNaN(input.minPrice)){
                query.andWhere('general_rent_fee','>=',Number(input.minPrice))
            }
            if(input.maxPrice && !isNaN(input.maxPrice)){
                query.andWhere('general_rent_fee','<=',Number(input.maxPrice))
            }
            if(input.propertyType && input.propertyType !== 'undefined' && input.propertyType !== undefined){
                query.andWhere('property_type','=',input.propertyType)
            }
            if(input.sort){
                query.orderBy('created_at', input.sort === 'oldest' ? 'asc' : 'desc')
            }
            if(input.location && input.location != undefined && input.location !== 'undefined' && input.location !=''){
                const [city,state,country] = input.location
                if(city){
                    query.andWhere((q)=>q.whereRaw(`city % ?`,[city]))
                }
                if(state){
                    query.andWhere((q)=>q.whereRaw(`state % ?`,[state]))
                }
                if(country){
                    query.andWhere((q)=>q.whereRaw(`country % ?`,[country]))
                }
            }
            if(input.currency && input.currency !== undefined && input.currency !== 'undefined'){
                query.andWhere('currency_id','=',input.currency)
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
            const processedData:Array<any> = []
            
            const user = await this.loginService.loggedInUser(auth)
            for(const item of data){
                processedData.push({
                    ...item.$attributes,
                    mediaItems:item.mediaItems,
                    currency:item.currency,
                    //@ts-ignore
                    isSaved:user ? await this.propertyService.isSavedProperty(user.id,item.id) : false
                })
            }
            return sendSuccess(response,{message:"Property listing", data:
                {
                  properties:processedData,
                  meta: data.getMeta()  
                }
            })
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async propertyInfo({request,auth,response}:HttpContext){
        try {
            const {id} = request.params()
            const data = await Property.query().select('*')
            .preload('amenities',(am)=>{
                am.select(['id','name'])
            })
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
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
            })
            .preload('mediaItems',(media)=>{
                media.select(['id',"media_url","media_type"])
            }).where('id','=',id)
           if(data){
            const user = await this.loginService.loggedInUser(auth)
            const d:Partial<Property> = {
                ...data[0].$attributes,
                amenities:data[0].amenities,
                fees:data[0].fees,
                legalRequirements:data[0].legalRequirements,
                owner:data[0].owner,
                utilities:data[0].utilities,
                currency:data[0].currency,
                mediaItems:data[0].mediaItems,
                //@ts-ignore
                isSaved:user ? await this.propertyService.isSavedProperty(user.id,data[0].id) : false
            }
            return sendSuccess(response,{data:d,message:"Property information"})
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
            return sendSuccess(response,{message:"Review submitted"})
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }


    public async propertyReviewSummary({request,response}:HttpContext){
        try {
            const { page,perPage,property_id } = request.qs()
            const property = await Property.find(property_id)
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


    public async userPropertyReview({request,auth,response}:HttpContext){
        try {
            const { property_id } = request.qs()
            const user = auth.use('api').user!
            const reviews = await PropertyReview.query()
            .select('*')
            
            .where('property','=',property_id)
            .andWhere('user_id','=', user.id)

            return sendSuccess(response,{message:"My reviews", data: reviews})
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
                for_user?:boolean|string
            }
            const input:Filter = request.qs()
            const properties = Property.query().select(['id','property_title','ask_price','general_rent_fee','total_purchases'])
            .where('property_type','!=','').andWhere('hidden','=',false)
            if(input.for_user && (input.for_user === true || input.for_user === 'true')){
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
                property.hidden = !property.hidden
                await property.save()
                return sendSuccess(response,{message:'Property status updated'})
            }else{
                return sendError(response,{message:'Property not found', code:404})
            }
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }

    public async deleteProperty({ request,response,auth }:HttpContext){
        try {
            const { id } = request.params()
            const user = auth.use('api').user
            const property = await Property.find(id)
            if(property && user){
                if(property.owner_id === user.id){
                    const totalTenants = await PropertyTenant.query().where((q)=>q.whereRaw(`property_id = ? AND status = ?`,[property.id,'approved'])).count('id','total')
                    if(totalTenants[0] && totalTenants[0].$extras.total >=1){
                        return sendError(response,{message:"Tenants already exist in this proeprty", code:403})
                    }else{
                        //Remove Legal Documents
                        const documents = await PropertyLegalRequirement.query().select(['document_url']).where('property','=',id)
                        documents.forEach(async(e)=>{
                            try {
                               await this.uploadService.removeFile(e.document_url,'legal-documents') 
                            } catch{/** */}
                        })
                        //Remove Property Media
                        const media = await PropertyMedia.query().select(['media_url']).where('property','=',id)
                        media.forEach(async(e)=>{
                            try {
                              await this.uploadService.removeFile(e.media_url,'properties')  
                            } catch {/** */}
                        })
                        //Remove Property Information
                        await property.delete()
                        return sendSuccess(response,{message:"Property Deleted"})
                    }
                }else{
                    return sendError(response,{message:"You cannot delete this property", code:403})
                }
            }else{
                return sendError(response,{message:"Property not found", code:404})
            }
        } catch (error) {
            return sendError(response,{error:error,message:error.message})
        }
    }

  public async deleteReview({ request, response, auth }: HttpContext) {
    try {
      const user = auth.use('api').user
      const { id } = request.params()

      const review = await PropertyReview.find(id)
      
      if (!review) {
        return sendError(response, { message: 'Review not found', code: 404 })
      }

      if(review?.user_id !== user?.id){
        return sendError(response,{ message:"You cannot delete this review", code:403})
      }

      await review.delete()

      return sendSuccess(response, { message: 'Review deleted successfully' })
    } catch (error) {
      return sendError(response, { error: error, message: error.message })
    }
  }

  public async searchLocationHint({request,response}:HttpContext){
    try {
        const {location} = request.params()
        const locations = await Property.query().select(['country','state','city']).whereRaw(`
            country % ? OR city % ? OR state % ?`,Array(3).fill(location)).limit(20)
        const data:string[] = []
        locations.forEach((e)=>{
            const d = [e.city || '',e.state || '',e.country || '']
            data.push(d.join(','))
        })
        return sendSuccess(response,{message:"Location search hint", data})
    } catch (error) {
        return sendError(response, { error: error, message: error.message })
    }
  }

  public async saveProperty({request, response, auth}:HttpContext){
    try{
        const user = auth.use('api').user
        if(!user){
            return sendError(response, { message: 'Unauthorized', code: 401 })
        }
        const { property_id } = request.body()
        //check if the property has been saved
        const existingSave = await SavedProperty
        .query()
        .select(['id'])
        .where("user_id","=",user.id)
        .andWhere ('property_id',"=", property_id)
        if (existingSave[0]) {
        await existingSave[0].delete()
        return sendSuccess(response, { message: 'Updated' })
        }
        //save the property
        const savedProperty = await SavedProperty.create({
        user_id: user.id,
        property_id: property_id,
        })
        return sendSuccess(response, {
        message: 'Property saved successfully',
        data: savedProperty,
        })
       // await request.validateUsing(savePropertyValidator)
    }catch (error) {
        // Handle validation errors or other errors
        return sendError(response, {
          message: 'Error saving property',
          error: error.messages || error.message,
          code: 400,
        })
      } 
  }
  async listSaveProperty({response, auth}:HttpContext){
    try {
        //const { property_id } = request.params()
        const user = auth.use('api').user
        if(!user){
            return sendError(response, { message: 'Unauthorized', code: 401 })
        }
        const items = await SavedProperty.query().select('*').where('user_id','=',user.id)
        .preload('propertyInfo',(item)=>{
            item.select('*')
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
            })
            .preload('mediaItems',(media)=>{
                media.select(['id',"media_url","media_type"])
            })
        })
        .preload('owner',(owner)=>{
            owner.select('*') //TODO:OPTIMIZE
        })
       const properties:Array<any> = []
        
       for(const item of items){
        const user = await this.loginService.loggedInUser(auth)
         properties.push({
            ...item.propertyInfo.$attributes,
            owner:item.propertyInfo.owner,
            currency:item.propertyInfo.currency,
            mediaItems:item.propertyInfo.mediaItems,
            //@ts-ignore
            isSaved:user ? await this.propertyService.isSavedProperty(user.id,data[0].id) : false
        })
       }
        
        return sendSuccess(response,{message:"Saved Properties",data:properties})
    } catch (error) {
        return sendError(response,{message:error.message,code:500})
    }
}
}



   
    