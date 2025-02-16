import router from '@adonisjs/core/services/router'
import HomePagesController from '#controllers/home_pages_controller'
import { middleware } from '#start/kernel'

router
    .group(() => {
        router.put('update-background-image', [HomePagesController, 'updateBackgroundImage']).use(middleware.auth({ guards: ['api_admin']}))
        router.put('update-banner-image', [HomePagesController, 'updateBannerImage']).use(middleware.auth({ guards: ['api_admin']}))
        router.put('update-header-text', [HomePagesController, 'updateHeaderText'])
        router.put('update-why-choose-us', [HomePagesController, 'updateWhyChooseUs'])
    })  
    .prefix('/homepage')