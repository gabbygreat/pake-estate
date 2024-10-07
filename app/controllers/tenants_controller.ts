import type { HttpContext } from '@adonisjs/core/http'
import { createTenantValidator } from '#validators/tenant_application'
import FileUploadService from '#services/fileupload_service'
import NotificationService from '#services/notification_service'
import { inject } from '@adonisjs/core'
import TenantDocument from '#models/tenant_document'
import { sendError, sendSuccess } from '../utils.js'
import PropertyTenant from '#models/property_tenant'
import Property from '#models/property'
import db from '@adonisjs/lucid/services/db'
import PropertyFee from '#models/property_fee'
import TenantApplicableFee from '#models/tenant_applicable_fee'
import Notification from '#models/notification'
import PropertyService from '#services/property_service'
import RentalInvoiceService from '#services/rentalinvoice_service'

@inject()
export default class TenantsController {
  constructor(
    protected uploadService: FileUploadService,
    protected notificationService: NotificationService,
    protected propertyService: PropertyService,
    protected rentalInvoiceService: RentalInvoiceService
  ) {}
  public async sendApplication({ request, auth, response }: HttpContext) {
    const docs: Array<Partial<TenantDocument>> = []
    try {
      await request.validateUsing(createTenantValidator)
      //Attend to ID files
      const identity_documents = request.files('identity_documents_files')
      const identity_documents_names: string[] = request.input('identity_documents_names')
      //Users must submit all document tags
      if (identity_documents.length !== identity_documents_names.length) {
        return sendError(response, {
          message: 'Please provide ID document information,tags and files must match!',
          code: 400,
        })
      }

      //Attend to Bank Documents/Records

      const bank_documents = request.files('bank_statement_files')
      const bank_documents_names: string[] = request.input('bank_statement_names')
      //Users must submit all document tags
      if (bank_documents.length !== bank_documents_names.length) {
        return sendError(response, {
          message: 'Please provide Bank stagement information,tags and files must match!',
          code: 400,
        })
      }

      if (identity_documents) {
        const items = await this.uploadService.uploadFiles(
          request,
          'identity_documents_files',
          'tenant-documents'
        )
        items.forEach((e, i) => {
          docs.push({
            document_category: 'identity',
            document_name: identity_documents_names[i],
            document_type: e.fileType,
            document_url: e.name,
          })
        })
      }

      if (bank_documents) {
        const items = await this.uploadService.uploadFiles(
          request,
          'bank_statement_files',
          'tenant-documents'
        )
        items.forEach((e, i) => {
          docs.push({
            document_category: 'bank_statement',
            document_name: bank_documents_names[i],
            document_type: e.fileType,
            document_url: e.name,
          })
        })
      }

      const {
        property_id,
        dob,
        fullname,
        mobile,
        email,
        gender,
        rental_history,
        employed,
        total_pets,
        employment_type,
        job_position,
        job_salary,
        company_name,
        pet_names,
        pet_types,
        pet_breeds,
        lease_start_date,
        lease_term,
        lease_payment,
        offering_price,
        employee_name,
        any_pets,
      } = request.body()

      await db.transaction(async (client) => {
        const owner = await Property.query({ client })
          .select(['owner_id', 'property_title'])
          .where('id', '=', property_id)

        const data = await PropertyTenant.create(
          {
            property_id,
            dob,
            fullname,
            mobile,
            email,
            employee_name,
            gender,
            rental_history: JSON.stringify(rental_history ?? {}),
            employed,
            total_pets: total_pets || 0,
            employment_type,
            job_position,
            job_salary,
            company_name,
            pet_names,
            pet_types: JSON.stringify(pet_types ?? []),
            offering_price,
            applicant_id: auth.use('api').user?.id,
            pet_breeds: JSON.stringify(pet_breeds ?? []),
            lease_payment,
            lease_term,
            any_pets,
            lease_start_date,
            status: 'in-progress',
            property_owner_id: owner[0].owner_id,
          },
          { client }
        )

        docs.map((e) => {
          e.property_id = data.property_id
          e.tenant_id = data.id
        })
        await TenantDocument.createMany(docs, { client })

        //Apply the fees
        const propertyFees = await PropertyFee.query({ client })
          .select(['id'])
          .where('property', '=', property_id)
        const tenantApplicableFees: Array<Partial<TenantApplicableFee>> = []
        propertyFees.forEach((fee) => {
          tenantApplicableFees.push({
            property_id: property_id,
            tenant_id: data.id,
            fee_id: fee.id,
          })
        })
        await TenantApplicableFee.createMany(tenantApplicableFees, { client })
        //TODO:: PROPERTY OWNER NOTIFICATION
        const notificationTemplate = this.notificationService
          .message()
          ['RENTAL_APPLICATION_SUBMISSION']({
            property_name: owner[0].property_title,
          })
        await Notification.create(
          {
            user_id: owner[0].owner_id,
            title: notificationTemplate.title,
            message: notificationTemplate.message,
            type: notificationTemplate.type,
            actor_refs: JSON.stringify([data.applicant_id]),
            entity_ids: JSON.stringify({ property_id: property_id }),
            slug: 'RENTAL_APPLICATION_SUBMISSION',
          },
          { client }
        )
        return sendSuccess(response, { message: 'Application Submitted', code: 200 })
      })
    } catch (error) {
      console.log(error)
      if (docs.length) {
        docs.forEach(async (e) => {
          this.uploadService.removeFile(e.document_url!, 'tenant-documents')
        })
      }
      return sendError(response, { message: error.message, code: 500, error })
    }
  }

  public async tenantRequests({ request, auth, response }: HttpContext) {
    try {
      interface Filter {
        user: 'tenant' | 'owner'
        property: string
        sort: 'recent' | 'oldest'
        status: 'in-progress' | 'rejected' | 'approved'
        search: string
        page: number
        perPage: number
      }
      const filter: Filter = request.qs() as Filter
      const query = PropertyTenant.query()
        .select('*')
        .preload('propertyInfo', (property) => property.select(['id', 'property_title']))
        .preload('applicantInfo', (applicant) =>
          applicant.select(['id', 'firstname', 'lastname', 'email'])
        )
      if (filter.user === 'owner') {
        query.where('property_owner_id', '=', auth.use('api').user?.id!)
      } else {
        query.where('applicant_id', '=', auth.use('api').user?.id!)
      }

      if (filter.status) {
        query.andWhere((q) => q.whereRaw('property_tenants.status = ?', [filter.status]))
      }

      if (filter.search) {
        query
          .join('properties', 'property_tenants.property_id', '=', 'properties.id')
          .where((q) =>
            q.whereRaw(
              'properties.property_title % ? OR property_tenants.email % ? OR property_tenants.fullname % ?',
              [...Array(3).fill(filter.search)]
            )
          )
          .groupBy(['properties.id', 'property_tenants.id'])
      }

      if (filter.property) {
        query.andWhere('property_id', '=', filter.property)
      }

      const order = filter.sort ? filter.sort : 'recent'
      const data = await query
        .orderBy('property_tenants.created_at', order === 'oldest' ? 'asc' : 'desc')
        .paginate(filter.page ?? 1, filter.perPage ?? 20)

      return sendSuccess(response, { message: 'Tenant applications', data: data })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async updateApplicationStatus({ request, response, auth }: HttpContext) {
    try {
      const { tenant_id, status } = request.params()
      const { reason } = request.body()
      const currentUser = auth.use('api').user?.id
      if (!/^rejected|approved/.test(status)) {
        return sendError(response, { message: 'Invalid status option', code: 400 })
      }
      const record = await PropertyTenant.find(tenant_id)
      if (record) {
        if (currentUser !== record.property_owner_id) {
          return sendError(response, { message: 'You cannot process this application', code: 403 })
        }
        record.status = status
        const property = await Property.query()
          .select(['property_title'])
          .where('id', '=', record.property_id)
        if (status === 'approved') {
          const notificationTemplate = this.notificationService
            .message()
            ['RENTAL_APPLICATION_ACCEPTANCE']({
              property_name: property[0].property_title,
            })
          await Notification.create({
            user_id: record.applicant_id,
            title: notificationTemplate.title,
            message: notificationTemplate.message,
            type: notificationTemplate.type,
            actor_refs: JSON.stringify([currentUser]),
            entity_ids: JSON.stringify({
              property_id: record.property_id,
              tenancy_application_id: record.id,
            }),
            slug: 'RENTAL_APPLICATION_ACCEPTANCE',
          })
          record.approval_date = new Date()
          //Generate RENTAL INVOICE FOR THE USER
          await this.rentalInvoiceService.generateInvoice(tenant_id)
        }
        if (status === 'rejected') {
          record.rejection_reason = reason
        }
        await record.save()
        return sendSuccess(response, {
          message: 'Application status updated successfully',
          code: 200,
        })
      } else {
        return sendError(response, { message: 'Application not found', code: 404 })
      }
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async applicationInfo({ request, response }: HttpContext) {
    try {
      const { tenant_id } = request.params()
      const result = await PropertyTenant.query()
        .select('*')
        .preload('propertyInfo', (property) => property.select(['id', 'property_title']))
        .preload('applicantInfo', (applicant) =>
          applicant.select(['id', 'firstname', 'lastname', 'email'])
        )
        .preload('documents', (documents) => documents.select('*'))
        .preload('applicableFees', (fees) => {
          fees.select(['id', 'fee_id', 'fee_discount']).preload('feeInfo', (feeInfo) => {
            feeInfo.select(['name', 'amount'])
          })
        })
        .where('id', '=', tenant_id)
      if (!result[0]) {
        return sendError(response, { message: 'Property Tenant not found', code: 404 })
      }
      return sendSuccess(response, { message: 'Application/Tenanr Information', data: result })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async tenantListing({ request, auth, response }: HttpContext) {
    try {
      interface Filter {
        property: string
        status: 'in-progress' | 'rejected' | 'approved' | 'cancelled'
        search: string
        page: number
        perPage: number
        startDate: Date
        endDate: Date
      }
      const filter: Filter = request.qs() as Filter

      const property_owner = auth.use('api').user?.id

      const query = PropertyTenant.query()
        .select('*')
        .where('property_owner_id', '=', property_owner!)
      if (filter.status) {
        query.andWhere('status', '=', filter.status)
      }
      if (
        filter.search &&
        filter.search !== null &&
        filter.search !== ('undefined' as any) &&
        filter.search !== undefined
      ) {
        // query.andWhere((q)=>q.whereRaw('email % ? OR fullname % ?',[...Array(2).fill(filter.search)]))
        query
          .join('properties', 'property_tenants.property_id', '=', 'properties.id')
          .where((q) => q.whereRaw('properties.property_title % ?', [filter.search]))
          .groupBy(['properties.id', 'property_tenants.id'])
      }
      if (filter.startDate) {
        query.andWhereBetween('created_at', [filter.startDate, filter.endDate ?? new Date()])
      }
      if (filter.property) {
        query.andWhere('property_id', '=', filter.property)
      }

      const tenants = await query
        .orderBy('property_tenants.created_at', 'desc')
        .paginate(filter.page ?? 1, filter.perPage ?? 20)
      return sendSuccess(response, { message: 'Tenant list', data: tenants })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async deleteApplication({ request, auth, response }: HttpContext) {
    try {
      const { id } = request.params()
      const user = auth.use('api').user!
      const application = await PropertyTenant.find(id)
      if (application) {
        if (application.applicant_id === user.id) {
          //Remove all documents
          const documents = await TenantDocument.query()
            .select(['document_url'])
            .where('tenant_id', '=', id)
          for (let i = 0; i < documents.length; i++) {
            try {
              await this.uploadService.removeFile(documents[i].document_url, 'tenant-documents')
            } catch {
              /** */
            }
          }
          await application.delete()
          return sendSuccess(response, {
            message: 'Application information deleted',
            code: 200,
          })
        } else {
          return sendError(response, {
            message: 'You cannot delete this application/tenant information',
            code: 403,
          })
        }
      } else {
        return sendError(response, { message: 'Application not found', code: 404 })
      }
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async listTenantsProperties({ auth, response }: HttpContext) {
    try {
      const tenant = auth.use('api').user!
      const properties = await PropertyTenant.query()
        .select(['id', 'property_id', 'applicant_id'])
        .where((q) => {
          q.whereRaw('applicant_id = ? AND status = ?', [tenant?.id, 'approved'])
        })
        .preload('propertyInfo', (property) => {
          property.select(['property_title'])
        })
      const data: Array<{ property_id: string; property_title: string }> = []

      properties.forEach((e) =>
        data.push({
          property_id: e.property_id,
          property_title: e.propertyInfo.property_title,
        })
      )

      return sendSuccess(response, {
        message: 'Tenant Property Listing',
        data: data,
      })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }

  public async TenantsPaymentStructure({ request, response }: HttpContext) {
    try {
      const { tenant_id } = request.params()
      await this.propertyService.syncNewlyAddedFees(tenant_id)
      const {fees} = await this.rentalInvoiceService.invoiceFees(tenant_id)
      return sendSuccess(response,{message:"Payment structure", data:fees})
    } catch (error) {
      return sendError(response, { message: 'Cannot load payment structure', code: 500 })
    }
  }

  public async UpdateTenantPaymentStructure({ request,auth,response}:HttpContext){
    try {
        const landlord = auth.use('api').user!
        const fees: Array<{
            slug: string
            name: string
            amount: number
            discount: number
            id: string | null
          }> = request.input("updated_fees")
        const tenant_id = request.input('tenant_id')
        const mainFee = fees.filter((e)=>e.slug === 'RENTAL_FEE')[0]
        const tenant = await PropertyTenant.find(tenant_id)
        if(tenant){
            if(tenant.property_owner_id === landlord.id){
                //Update the main rental fee section
                tenant.discount_price = mainFee.discount
                tenant.offering_price = mainFee.amount
                await tenant.save()

                const otherFees:Array<Partial<TenantApplicableFee>> = []
                fees.forEach((x)=>{
                    if(x.slug !== 'RENTAL_FEE'){
                        otherFees.push({
                            id: x.id!,
                            fee_discount: Number((Number(x.discount).toFixed(2)))
                        })
                    }
                })
                await TenantApplicableFee.updateOrCreateMany('id',otherFees)
                return sendSuccess(response,{message:"Payment structure updated"})
            }else{
                return sendError(response,{message:"You cannot carry out this operation!", code:403})
            }
        }else{
            return sendError(response,{message:"Tenant not found!", code:404})
        }
    } catch (error) {
        console.log(error)
        return sendError(response, { message: 'Cannot update payment structure', code: 500 })
    }
  }
}
