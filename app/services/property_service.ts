import Property from "#models/property";
import { Request,Response } from "@adonisjs/core/http";
import { sendError, sendSuccess } from "../utils.js";
import PropertyAmenity from "#models/property_amenity";
import db from "@adonisjs/lucid/services/db";
import PropertyUtility from "#models/property_utility";

export type DocumentationStages = 
'PROPERTY_INFORMATION'|
'FEATURE'|
'FINANCIAL_INFORMATION'|
'CONTACT_INFORMATION'|
'MEDIA_INFORMATION'|
'LEGAL_INFORMATION'

export default class PropertyService{


    async handlePropertyInformation(request:Request,response:Response){
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
                latitude
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

    async handleFinancialInformation(){

    }

    async handlePropertyContact(){

    }

    async handlePropertyMedia(){

    }

    async handlePropertyLegalInfo(){

    }

    async updateReviewAndRating(){

    }

    async updatePurchaseCount(){

    }
    
}