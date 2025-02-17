import router from '@adonisjs/core/services/router'
import AboutPagesController from '#controllers/about_pages_controller'
import { middleware } from '#start/kernel'


router
    .group(() => {
        router.put('update-info', [AboutPagesController, 'updateInfo'])
        router.put('update-what-we-do', [AboutPagesController, 'updateWhatWeDo'])
        router.put('update-aim', [AboutPagesController, 'updateAim']).use(middleware.auth({ guards: ['api_admin']}))
        router.put('update-who-are-we', [AboutPagesController, 'updateWhoAreWe'])
        router.put('update-header-text', [AboutPagesController, 'updateHeaderText'])
        router.put('update-background-image', [AboutPagesController, 'updateBackgroundImage']).use(middleware.auth({ guards: ['api_admin']}))

}).prefix('/aboutpage')