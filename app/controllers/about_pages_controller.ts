import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import { sendError, sendSuccess } from '../utils.js'
import AboutPage from '#models/about_page'

@inject()
export default class AboutPagesController {
    constructor(
        protected fileUpload:FileUploadService
   ){}
    async updateBackgroundImage({ request, auth, response }: HttpContext) {
        try {
            const user = auth.use('api_admin').user
            if (!user) {
                return sendError(response,{message:'Admin not Authorized'})
            }
            console.log('GOT HERE')
        const about = request.file('background_Image')
        if (about) {
        // Use the upload service to store the background image and get the URL
        const backgroundImageUrl = await this.fileUpload.uploadFiles(
        request,
        'background image',   // Field name in the form
        'backgroundImage'    // Destination folder in the storage
     )
        // Update user background image URL in the database
     user.background_Image = backgroundImageUrl[0].name
     }
     await user.save()
     return sendSuccess(response,{message:'Background image successfully changed'})
     } catch (error) {
        return sendError(response,{message: error.message})
     }
    }
    async updateHeaderText({ request, response }: HttpContext) {
        const about = await AboutPage.create({})
        about.header_text = request.input('header_text')
        await about.save()
    
        return sendSuccess(response,{message:'Header Text successfully changed'})
    }
    async updateWhoAreWe({ request, response }: HttpContext) {
        const inquire = await AboutPage.create({})
        inquire.who_are_we = request.input('who_are_we')
        await inquire.save()
    
        return sendSuccess(response,{message:'Why Are We successfully changed'})
    }
    async updateAim({ request, auth, response }: HttpContext) {
        const user = auth.use('api_admin').user
        if (!user) {
            return sendError(response,{message:'Admin not Authorized'})
        }
        const about = request.file('background_Image')
        if (about) {
        // Use the upload service to store the background image and get the URL
        const backgroundImageUrl = await this.fileUpload.uploadFiles(
        request,
        'background image',   // Field name in the form
        'backgroundImage'    // Destination folder in the storage
     )
        // Update user background image URL in the database
     user.background_Image = backgroundImageUrl[0].name
     }
     await user.save()
        const purpose = await AboutPage.create({})
        purpose.aim = request.input('aim')
        await purpose.save()
    
        return sendSuccess(response,{message:'Aim successfully changed'})
    }
    async updateWhatWeDo({ request, response }: HttpContext) {
        const services = await AboutPage.create({})
        services.what_we_do = request.input('what_we_do')
        await services.save()
    
        return sendSuccess(response,{message:'What we do successfully changed'})
    }
    async updateInfo({ request, response }: HttpContext) {
        const info = await AboutPage.create({})
        info.properties = request.input('properties')
        info.renters = request.input('renters')
        info.managers = request.input('managers')
        info.brokers = request.input('brokers')
        if (!info.properties || !info.renters || !info.managers || !info.brokers ) {
            return sendError(response,{message:'input all field'})
        }
        await info.save()
    
        return sendSuccess(response,{message:'Header Text successfully changed'})
    }
}