import router from '@adonisjs/core/services/router'
import AboutPagesController from '#controllers/about_pages_controller'


router
    .group(() => {
        router.put('update-info', [AboutPagesController, 'updateInfo'])

}).prefix('/aboutpage')