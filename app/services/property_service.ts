import Property from "#models/property";
import { Request,Response } from "@adonisjs/core/http";
import { sendError, sendSuccess } from "../utils.js";
import PropertyAmenity from "#models/property_amenity";
import db from "@adonisjs/lucid/services/db";
import PropertyUtility from "#models/property_utility";
import PropertyFee from "#models/property_fee";
import FileUploadService from "./fileupload_service.js";
import PropertyMedia from "#models/property_media";
import PropertyLegalRequirement from "#models/property_legal_requirement";

export type DocumentationStages = 
'PROPERTY_INFORMATION'|
'FEATURE'|
'FINANCIAL_INFORMATION'|
'CONTACT_INFORMATION'|
'MEDIA_INFORMATION'|
'LEGAL_INFORMATION'

export default class PropertyService{


    async handlePropertyInformation(request:Request,response:Response,owner:string){
        try {
            //Validate the request
            const {
                id,
                property_title,
                property_type,
                unit_number,
                general_capacity,
                house_number,
                street_name,
                city,postal_code,
                state,country,longitude,
                latitude,
                property_description
            } = request.body()
            let property:Property
            if(id){
                property = (await Property.find(id)) as Property
                if(!property){
                    return sendError(response,{message:"Property not found", code:404})
                }
            }else{
                property = new Property()
            }
            property.property_title = property_title
            property.property_type = property_type
            property.unit_number = unit_number
            property.general_capacity = general_capacity
            property.house_number = house_number
            property.street_name = street_name
            property.city = city
            property.postal_code = postal_code
            property.state = state
            property.country = country
            property.longitude = longitude
            property.latitude = latitude
            property.current_state = 'draft'
            property.property_description = property_description
            property.owner_id = property.owner_id ?? owner
            await property.save()
            return sendSuccess(response,{message:"Property information updated",data:property})
        } catch (error) {
            throw error
        }
    }

    async handlePropertyFeature(request:Request,response:Response){
        try {
            //Validations
            let PAmenities:string[] = request.input('amenities')
            let PUtilities:string[] = request.input('utilities')
            const { furnishing,pet_policy,maintainance_information,id} = request.body()
            await db.transaction(async(client)=>{

            if(PAmenities.length){
                const prevAmenities = await PropertyAmenity.query({client}).select(['id','name']).where('property','=',id)
                if(prevAmenities.length){
                    const toDelete:string[] = []
                    const toAdd:Array<Partial<PropertyAmenity>> = []
                    //Check records in DB not in Request list
                    prevAmenities.forEach((e)=>{ //ITEM DOES NOT EXIST IN REQUEST BUT IN DB,SO IT HAS BEEN REMOVED
                        if(!PAmenities.includes(e.name)){
                            toDelete.push(e.id)
                        }
                    })
                    await PropertyAmenity.query({client}).whereIn('id',toDelete).delete()
                    //Check records in Request list not in DB
                    PAmenities.forEach((e)=>{
                        if(prevAmenities.findIndex((dbItem)=>dbItem.name === e) < 0){ //Item does not exist in DB,SO IT'S A NEW ADDITION
                            toAdd.push({property:id,name:e})
                        }
                    })
                    await PropertyAmenity.createMany(toAdd,{client})
                }else{
                    const records:Array<Partial<PropertyAmenity>> = []
                    PAmenities.forEach((e)=>records.push({name:e,property:id}))
                    await PropertyAmenity.createMany(records)
                }
            }
            if(PUtilities.length){
                const prevUtilities = await PropertyUtility.query({client}).select(['id','name']).where('property','=',id)
                if(prevUtilities.length){
                    const toDelete:string[] = []
                    const toAdd:Array<Partial<PropertyUtility>> = []
                    //Check records in DB not in Request list
                    prevUtilities.forEach((e)=>{ //ITEM DOES NOT EXIST IN REQUEST BUT IN DB,SO IT HAS BEEN REMOVED
                        if(!PUtilities.includes(e.name)){
                            toDelete.push(e.id)
                        }
                    })
                    await PropertyUtility.query({client}).whereIn('id',toDelete).delete()
                    //Check records in Request list not in DB
                    PUtilities.forEach((e)=>{
                        if(prevUtilities.findIndex((dbItem)=>dbItem.name === e) < 0){ //Item does not exist in DB,SO IT'S A NEW ADDITION
                            toAdd.push({property:id,name:e})
                        }
                    })
                    await PropertyUtility.createMany(toAdd,{client})
                }else{
                    const records:Array<Partial<PropertyUtility>> = []
                    PUtilities.forEach((e)=>records.push({name:e,property:id}))
                    await PropertyUtility.createMany(records)
                }
            }
            //uPDATE OTHER RECORDS OF THE PROPERTY
            await Property.query({client}).update({maintainance_information,pet_policy,furnishing}).where('id','=',id)
            return sendSuccess(response,{message:"Property features updated"})
        })
        } catch (error) {
            throw error
        }
    }

    async handleFinancialInformation(request:Request,response:Response){
        try {
            type Fee = Array<Partial<PropertyFee>>
            const id = request.input('id')
            const additionalFees:Fee = request.input('additional_fees')
            const toAdd:Fee = []
            const toDelete:string[] = []
            const { general_rent_fee, general_lease_time, general_renewal_cycle, security_deposit } = request.body()
            if(!/yearly|monthly|daily|weekly|hourly/.test(general_renewal_cycle)){
                return sendError(response,{message:"Invalid billing cycle option",code:400})
            }
            await db.transaction(async(client)=>{
                const prevFees = await PropertyFee.query({client}).select(['id','name','amount']).where('property','=',id)
                if(prevFees.length){
                    //Go through DB list to update or mark existing records for deletion
                    for(let fee of prevFees){
                        const feeIndex = additionalFees.findIndex((e)=>e.id === fee.id)
                        if(feeIndex < 0){
                            toDelete.push(fee.id)
                        }else{
                            fee.amount = additionalFees[feeIndex].amount!
                            fee.name = additionalFees[feeIndex].name!
                            await fee.useTransaction(client).save()
                        }
                    }
                    //GO through the Request list to add new items
                    additionalFees.forEach((e)=>{
                        if(!e.id){
                            toAdd.push({name:e.name,amount:e.amount,property:id})
                        }
                    })
                }else{
                    additionalFees.forEach((e)=>{toAdd.push({property:id,name:e.name,amount:e.amount})})
                }
                await PropertyFee.createMany(toAdd,{client}) //Now create the newly added additonal fees
                await PropertyFee.query({client}).whereIn('id',toDelete).delete() //Now delete all fees removed from the client side
                
                await Property.query({client}).update({
                    general_rent_fee, general_lease_time, general_renewal_cycle, security_deposit
                }).where('id','=',id) //Now updated the property fee records

                return sendSuccess(response,{message:"Financial information updated"})
            })
        } catch (error) {
            throw error
        }
    }

    async handlePropertyMediaUpload(req:Request,res:Response){
        try {
            const id = req.input('id')
            if(!req.files('media')){
                return sendError(res,{message:"Invalid uploads", code:400})
            }
            const uploads = await new FileUploadService().uploadFiles(req,'media','properties')
            const items:Array<Partial<PropertyMedia>> = []
            uploads.forEach((e)=>items.push({property:id,media_url:e.name,media_type:e.fileType}))
            await PropertyMedia.createMany(items)
            return sendSuccess(res,{message:"Media items uploaded"}) 
        } catch (error) {
            throw error
        }
    }

    async handlePropertyContact(){

    }

    async handlePropertyLegalInfo(request:Request,response:Response){
        try {
            const { tenant_screening_criteria, legal_disclosure, id } = request.body()
            console.log(tenant_screening_criteria)
            console.log(legal_disclosure)
            console.log(id)
            let data:Partial<PropertyLegalRequirement>
    
            if(request.file('tenant_screening_criteria_doc')){
                const upload = await new FileUploadService().uploadFiles(request,'tenant_screening_criteria_doc','legal-documents')
                data = {property:id,name:'tenant_screening_criteria',description:tenant_screening_criteria,document_url:upload[0].name}
                const existing = await PropertyLegalRequirement.query().select('*').where('property','=',id).andWhere('name','=','tenant_screening_criteria')
                if(existing[0]){
                    existing[0].property = data.id!
                    existing[0].name = data.name!
                    existing[0].document_url = upload[0].name ?? existing[0].document_url
                    await existing[0].save()
                }else{
                    await PropertyLegalRequirement.create(data)
                }
                
            }

            if(request.file('legal_disclosure_doc')){
                const upload = await new FileUploadService().uploadFiles(request,'legal_disclosure_doc','legal-documents')
                data = {property:id,name:'legal_disclosure',description:legal_disclosure,document_url:upload[0].name}
                const existing = await PropertyLegalRequirement.query().select('*').where('property','=',id).andWhere('name','=','legal_disclosure')
                if(existing[0]){
                    existing[0].property = data.id!
                    existing[0].name = data.name!
                    existing[0].document_url = upload[0].name ?? existing[0].document_url
                    await existing[0].save()
                }else{
                    await PropertyLegalRequirement.create(data)
                }
            }
            return sendSuccess(response,{message:"Legal records updated", code:200})
        } catch (error) {
            throw error
        }
    }

    async updatePurchaseCount(){

    }

    async updateRatingandReview(propertyID:string){
        const data = await db.rawQuery("SELECT COUNT(id) as total_review,SUM(rating) as total_rating FROM property_reviews")
        const totalRating = data.rows[0].total_rating ?? 0
        const totalReview = data.rows[0].total_review ?? 0
        const averageRating = (totalRating / totalReview).toFixed(2)
        if(totalRating && totalReview){
            await Property.query().where('id','=',propertyID).update({
                total_reviews: totalReview,
                total_rating: averageRating
            })
        }
    }
    
}