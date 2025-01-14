/* eslint-disable no-useless-catch */
import Property from '#models/property'
import { Request, Response } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import PropertyAmenity from '#models/property_amenity'
import db from '@adonisjs/lucid/services/db'
import PropertyUtility from '#models/property_utility'
import PropertyFee from '#models/property_fee'
import FileUploadService from './fileupload_service.js'
import PropertyMedia from '#models/property_media'
import PropertyLegalRequirement from '#models/property_legal_requirement'
import TenantApplicableFee from '#models/tenant_applicable_fee'
import PropertyTenant from '#models/property_tenant'
import SavedProperty from '#models/saved_property'
import NotificationService from './notification_service.js'
import Notification from '#models/notification'

export type DocumentationStages =
  | 'PROPERTY_INFORMATION'
  | 'FEATURE'
  | 'FINANCIAL_INFORMATION'
  | 'CONTACT_INFORMATION'
  | 'MEDIA_INFORMATION'
  | 'LEGAL_INFORMATION'

export default class PropertyService {
  async handlePropertyInformation(request: Request, response: Response, owner: string) {
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
        city,
        postal_code,
        state,
        listing_type,
        country,
        longitude,
        latitude,
        property_description,
        bedrooms,
        bathrooms,
        furnishing,
      } = request.body()
      let property: Property
      if (id) {
        property = (await Property.find(id)) as Property
        if (!property) {
          return sendError(response, { message: 'Property not found', code: 404 })
        }
      } else {
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
      property.bedrooms = bedrooms
      property.bathrooms = bathrooms
      property.furnishing = furnishing
      property.listing_type = listing_type
      property.payment_grace_period = 3600 * 24 * 3 //3 DAYS GRACE PERIOD
      await property.save()
      return sendSuccess(response, { message: 'Property information updated', data: property })
    } catch (error) {
      throw error
    }
  }

  async handlePropertyFeature(request: Request, response: Response) {
    try {
      //Validations
      const PAmenities: string[] = request.input('amenities')
      const PUtilities: string[] = request.input('utilities')
      const { furnishing, pet_policy, maintainance_information, id } = request.body()
      await db.transaction(async (client) => {
        if (PAmenities.length) {
          const prevAmenities = await PropertyAmenity.query({ client })
            .select(['id', 'name'])
            .where('property', '=', id)
          if (prevAmenities.length) {
            const toDelete: string[] = []
            const toAdd: Array<Partial<PropertyAmenity>> = []
            //Check records in DB not in Request list
            prevAmenities.forEach((e) => {
              //ITEM DOES NOT EXIST IN REQUEST BUT IN DB,SO IT HAS BEEN REMOVED
              if (!PAmenities.includes(e.name)) {
                toDelete.push(e.id)
              }
            })
            await PropertyAmenity.query({ client }).whereIn('id', toDelete).delete()
            //Check records in Request list not in DB
            PAmenities.forEach((e) => {
              if (prevAmenities.findIndex((dbItem) => dbItem.name === e) < 0) {
                //Item does not exist in DB,SO IT'S A NEW ADDITION
                toAdd.push({ property: id, name: e })
              }
            })
            await PropertyAmenity.createMany(toAdd, { client })
          } else {
            const records: Array<Partial<PropertyAmenity>> = []
            PAmenities.forEach((e) => records.push({ name: e, property: id }))
            await PropertyAmenity.createMany(records)
          }
        }
        if (PUtilities.length) {
          const prevUtilities = await PropertyUtility.query({ client })
            .select(['id', 'name'])
            .where('property', '=', id)
          if (prevUtilities.length) {
            const toDelete: string[] = []
            const toAdd: Array<Partial<PropertyUtility>> = []
            //Check records in DB not in Request list
            prevUtilities.forEach((e) => {
              //ITEM DOES NOT EXIST IN REQUEST BUT IN DB,SO IT HAS BEEN REMOVED
              if (!PUtilities.includes(e.name)) {
                toDelete.push(e.id)
              }
            })
            await PropertyUtility.query({ client }).whereIn('id', toDelete).delete()
            //Check records in Request list not in DB
            PUtilities.forEach((e) => {
              if (prevUtilities.findIndex((dbItem) => dbItem.name === e) < 0) {
                //Item does not exist in DB,SO IT'S A NEW ADDITION
                toAdd.push({ property: id, name: e })
              }
            })
            await PropertyUtility.createMany(toAdd, { client })
          } else {
            const records: Array<Partial<PropertyUtility>> = []
            PUtilities.forEach((e) => records.push({ name: e, property: id }))
            await PropertyUtility.createMany(records)
          }
        }
        //uPDATE OTHER RECORDS OF THE PROPERTY
        await Property.query({ client })
          .update({ maintainance_information, pet_policy, furnishing })
          .where('id', '=', id)
        return sendSuccess(response, { message: 'Property features updated' })
      })
    } catch (error) {
      throw error
    }
  }

  async handleFinancialInformation(request: Request, response: Response) {
    try {
      type Fee = Array<Partial<PropertyFee>>
      const id = request.input('id')
      const additionalFees: Fee = request.input('additional_fees')
      const toAdd: Fee = []
      const toDelete: string[] = []
      const { general_rent_fee, general_lease_time, general_renewal_cycle, security_deposit, currency_id } =
        request.body()
      if (!/yearly|monthly|daily|weekly|hourly/.test(general_renewal_cycle)) {
        return sendError(response, { message: 'Invalid billing cycle option', code: 400 })
      }
      await db.transaction(async (client) => {
        const prevFees = await PropertyFee.query({ client })
          .select(['id', 'name', 'amount'])
          .where('property', '=', id)
        if (prevFees.length) {
          //Go through DB list to update or mark existing records for deletion
          for (const fee of prevFees) {
            const feeIndex = additionalFees.findIndex((e) => e.id === fee.id)
            if (feeIndex < 0) {
              toDelete.push(fee.id)
            } else {
              fee.amount = additionalFees[feeIndex].amount!
              fee.name = additionalFees[feeIndex].name!
              await fee.useTransaction(client).save()
            }
          }
          //GO through the Request list to add new items
          additionalFees.forEach((e) => {
            if (!e.id) {
              toAdd.push({ name: e.name, amount: e.amount, property: id })
            }
          })
        } else {
          additionalFees.forEach((e) => {
            toAdd.push({ property: id, name: e.name, amount: e.amount })
          })
        }
        await PropertyFee.createMany(toAdd, { client }) //Now create the newly added additonal fees
        await PropertyFee.query({ client }).whereIn('id', toDelete).delete() //Now delete all fees removed from the client side

        await Property.query({ client })
          .update({
            general_rent_fee,
            general_lease_time,
            general_renewal_cycle,
            security_deposit,
            currency_id
          })
          .where('id', '=', id) //Now updated the property fee records
        //Update the tenant's offering price,
        await PropertyTenant.query({client})
        .update({
          offering_price: general_rent_fee
        })
        .where('property_id','=',id)
        
        return sendSuccess(response, { message: 'Financial information updated' })
      })
    } catch (error) {
      throw error
    }
  }

  async handlePropertyMediaUpload(req: Request, res: Response) {
    try {
      const id = req.input('id')
      if (!req.files('media')) {
        return sendError(res, { message: 'Invalid uploads', code: 400 })
      }
      const uploads = await new FileUploadService().uploadFiles(req, 'media', 'properties')
      const items: Array<Partial<PropertyMedia>> = []
      uploads.forEach((e) =>
        items.push({ property: id, media_url: e.name, media_type: e.fileType })
      )
      await PropertyMedia.createMany(items)
      return sendSuccess(res, { message: 'Media items uploaded' })
    } catch (error) {
      throw error
    }
  }

  async handlePropertyContact() {}

  async handlePropertyLegalInfo(request: Request, response: Response) {
    try {
      const { tenant_screening_criteria, legal_disclosure, id } = request.body()
      const tenant_screening_criteria_doc = request.files('tenant_screening_criteria_doc')
      const legal_disclosure_doc = request.files('legal_disclosure_doc')

      const files = { tenant_screening_criteria_doc: '', legal_disclosure_doc: '' }
      //Upload files
      const uploadService = new FileUploadService()
      if (tenant_screening_criteria_doc.length) {
        const uploadedFile = await uploadService.uploadFiles(
          request,
          'tenant_screening_criteria_doc',
          'legal-documents'
        )
        files['tenant_screening_criteria_doc'] = uploadedFile[0].name
      }

      if (legal_disclosure_doc.length) {
        const uploadedFile = await uploadService.uploadFiles(
          request,
          'legal_disclosure_doc',
          'legal-documents'
        )
        files['legal_disclosure_doc'] = uploadedFile[0].name
      }

      //Update records for tenant_screening_criteria
      if (tenant_screening_criteria_doc || tenant_screening_criteria) {
        let doc: PropertyLegalRequirement
        doc = (
          await PropertyLegalRequirement.query()
            .select('*')
            .whereRaw('property = ? AND name = ?', [id, 'tenant_screening_criteria'])
        )[0]
        if (!doc) {
          doc = new PropertyLegalRequirement()
        }
        doc.name = 'tenant_screening_criteria'
        doc.description = tenant_screening_criteria
        if (doc.document_url && files['tenant_screening_criteria_doc'].length) {
          try {
            await uploadService.removeFile(doc.document_url, 'legal-documents')
          } catch {/** */}
        }
        doc.document_url = files['tenant_screening_criteria_doc'] || doc.document_url
        doc.property = id
        await doc.save()
      }
      //Update records for legal_disclosure
      if (legal_disclosure_doc || legal_disclosure) {
        let doc: PropertyLegalRequirement
        doc = (
          await PropertyLegalRequirement.query()
            .select('*')
            .whereRaw('property = ? AND name = ?', [id, 'legal_disclosure'])
        )[0]
        if (!doc) {
          doc = new PropertyLegalRequirement()
        }
        doc.name = 'legal_disclosure'
        doc.description = legal_disclosure
        if (doc.document_url && files['legal_disclosure_doc']) {
          try {
            await uploadService.removeFile(doc.document_url, 'legal-documents')
          } catch {/** */}
        }
        doc.document_url = files['legal_disclosure_doc'] || doc.document_url
        doc.property = id
        console.log('saving doc')
        await doc.save()
      }
      return sendSuccess(response, { message: 'Legal records updated', code: 200 })
    } catch (error) {
      throw error
    }
  }

  async updatePurchaseCount() {}

  async updateRatingandReview(
    {propertyID,propertyName,ownerId,reviewId,reviewerId}:
    {propertyID: string,propertyName:string,ownerId:string,reviewId:string,reviewerId:string}) {
    const data = await db.rawQuery(
      `SELECT COUNT(id) as total_review,SUM(rating) as total_rating FROM property_reviews WHERE property = '${propertyID}'`
    )
    const totalRating = data.rows[0].total_rating ?? 0
    const totalReview = data.rows[0].total_review ?? 0
    const averageRating = (totalRating / totalReview).toFixed(2)
    if (totalRating && totalReview) {
      await Property.query().where('id', '=', propertyID).update({
        total_reviews: totalReview,
        total_rating: averageRating,
      })
    }

    if(totalReview === 1){
      const notificationService = new NotificationService()
      const notificationTemplate = notificationService.message()['NEW_REVIEW_NOTIFICATION']({property_name: propertyName})
      await Notification.create({
        user_id: ownerId,
        title: notificationTemplate.title,
        message: notificationTemplate.message,
        type: notificationTemplate.type,
        actor_refs: JSON.stringify([reviewerId]),
        entity_ids: JSON.stringify({
          property_id: propertyID,
          review_id: reviewId,
        }),
        slug: 'NEW_REVIEW_NOTIFICATION',
      })
    }
  }

  async syncNewlyAddedFees(tenant_id:string,){
    try {
        //Get all fees in applicable fees not existing in applcable fees
        const allApplicableFees = await TenantApplicableFee.query().select(['fee_id','property_id']).whereRaw('tenant_id = ?',[tenant_id])
        const ids:string[] = []
        allApplicableFees.forEach((e)=>ids.push(e.fee_id))
        if(allApplicableFees.length){
            const newFees = await PropertyFee.query().select(['id','amount','name'])
            .where('property','=',allApplicableFees[0].property_id)
            .andWhereNotIn('id',ids)
            if(newFees.length){
                const fees:Array<Partial<TenantApplicableFee>> = []
                newFees.forEach((f)=>{fees.push({
                    property_id: allApplicableFees[0].property_id,
                    tenant_id,
                    fee_id:f.id,
                    fee_discount:0,
                })})
                await TenantApplicableFee.createMany(fees)
            }
        }else{
            const tenantInfo = await PropertyTenant.query().select(['property_id']).where('id','=',tenant_id)
            const newFees = await PropertyFee.query().select(['id','amount','name'])
            .where('property','=',tenantInfo[0].property_id)
            if(newFees.length){
                const fees:Array<Partial<TenantApplicableFee>> = []
                newFees.forEach((f)=>{fees.push({
                    property_id: tenantInfo[0].property_id,
                    tenant_id,
                    fee_id:f.id,
                    fee_discount:0,
                })})
                await TenantApplicableFee.createMany(fees)
            }
        }
    } catch {
        /** */
    }
  }

  async isSavedProperty(user:string,property:string):Promise<boolean>{
    const id = await SavedProperty.query().select(['id']).where('user_id','=',user).andWhere('property_id','=',property)
    return id[0] ? true : false
  }

  async userCanReview({user,property}:{user:string,property:string}):Promise<boolean>{
    const isTenant = await PropertyTenant.query().select(['id'])
    .whereRaw('property_id=? AND applicant_id=? AND payment_status=?',[property,user,'fully-paid'])
    console.log(isTenant[0])
    return (isTenant[0]) ? true : false
  }
}
