import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import { sendError, sendSuccess } from '../utils.js'
import HomePage from '#models/home_page'

@inject()
export default class HomePagesController {
  constructor(protected fileUpload: FileUploadService) {}
  async updateBackgroundImage({ request, auth, response }: HttpContext) {
    try {
      const user = auth.use('api_admin').user
      if (!user) {
        return sendError(response, { message: 'Admin not Authorized' })
      }
      const backgroundImage = request.file('background_image')

      if (backgroundImage) {
        // Use the upload service to store the background image and get the URL
        const backgroundImageUrl = await this.fileUpload.uploadFiles(
          request,
          'background_image', // Field name in the form
          'backgroundImage' // Destination folder in the storage
        )

        const homepage = await HomePage.updateOrCreate(
          { admin_id: user.id }, // Search condition
          { background_image: backgroundImageUrl[0].name }
        )
        await homepage.save()
        return sendSuccess(response, { message: 'Background image successfully changed' })
      } else {
        return sendError(response, { message: 'No background image found' })
      }
    } catch (error) {
      return sendError(response, { message: error.message })
    }
  }

  async updateHeaderText({ request, auth, response }: HttpContext) {
    try {
      const user = auth.use('api_admin').user
      if (!user) {
        return sendError(response, { message: 'Admin not Authorized' })
      }
      const inputHeaderText = request.input('header_text')
      if (!inputHeaderText) {
        return sendError(response, { message: 'Header text is not entered' })
      }

      const homepage = await HomePage.updateOrCreate(
        { admin_id: user.id }, // Search condition
        { header_text: inputHeaderText } // Fields to update or create
      )
      await homepage.save()
      return sendSuccess(response, { message: 'Header text successfully changed' })
    } catch (error) {
      return sendError(response, { message: error.message })
    }
  }

  async updateWhyChooseUs({ request, response }: HttpContext) {
    const homepage = await HomePage.create({})
    homepage.why_choose_us = request.input('why_choose_us')
    await homepage.save()

    return sendSuccess(response, { message: 'Why Choose Us successfully changed' })
  }
  async updateBannerImage({ request, auth, response }: HttpContext) {
    try {
      const user = auth.use('api_admin').user
      if (!user) {
        return sendError(response, { message: 'Admin not Authorized' })
      }
      console.log('GOT HERE')
      const bannerImage = request.file('banner_image')
      if (bannerImage) {
        // Use the upload service to store the background image and get the URL
        const bannerImageUrl = await this.fileUpload.uploadFiles(
          request,
          'banner_image', // Field name in the form
          'bannerImage' // Destination folder in the storage
        )
        // Update user profile picture URL in the database
        user.banner_Image = bannerImageUrl[0].name
      }
      await user.save()
      return sendSuccess(response, { message: 'Banner image successfully changed' })
    } catch (error) {
      return sendError(response, { message: error.message })
    }
  }
}
