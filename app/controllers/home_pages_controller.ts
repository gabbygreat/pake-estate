import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import { sendError, sendSuccess } from '../utils.js'
import HomePage from '#models/home_page'


@inject()

export default class HomePagesController {
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
        const homepage = request.file('background_Image')
        if (homepage) {
        // Use the upload service to store the background image and get the URL
        const backgroundImageUrl = await this.fileUpload.uploadFiles(
        request,
        'background image',   // Field name in the form
        'backgroundImage'    // Destination folder in the storage
     )
        // Update user profile picture URL in the database
     user.background_Image = backgroundImageUrl[0].name
     }
     await user.save()
     return sendSuccess(response,{message:'Background image successfully changed'})
     } catch (error) {
        return sendError(response,{message: error.message})
     }
    }
    async updateHeaderText({ request, response }: HttpContext) {
        const homepage = await HomePage.create({})
        homepage.header_Text = request.input('header_text')
        await homepage.save()
    
        return sendSuccess(response,{message:'Header Text successfully changed'})
    }
    async updateWhyChooseUs({ request, response }: HttpContext) {
        const homepage = await HomePage.create({})
        homepage.header_Text = request.input('why_choose_us')
        await homepage.save()
    
        return sendSuccess(response,{message:'Why Choose Us successfully changed'})
    }
    async updateBannerImage({ request, auth, response }: HttpContext) {
        try {
            const user = auth.use('api_admin').user
            if (!user) {
                return sendError(response,{message:'Admin not Authorized'})
            }
            console.log('GOT HERE')
        const homepage = request.file('banner_Image')
        if (homepage) {
        // Use the upload service to store the background image and get the URL
        const bannerImageUrl = await this.fileUpload.uploadFiles(
        request,
        'background image',   // Field name in the form
        'bannerImage'    // Destination folder in the storage
     )
        // Update user profile picture URL in the database
     user.banner_Image = bannerImageUrl[0].name
     }
     await user.save()
     return sendSuccess(response,{message:'Banner image successfully changed'})
     } catch (error) {
        return sendError(response,{message: error.message})
     }
    }
}





