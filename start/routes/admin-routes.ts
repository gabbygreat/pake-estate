import router from '@adonisjs/core/services/router'
import AdminController from '#controllers/admin_controller'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.post('/login', [AdminController, 'login'])
    router.post('/create-admin', [AdminController, 'adminCreation'])
    router.delete('/delete/:id', [AdminController, 'deleteAdmin']).use(middleware.auth({ guards: ['api_admin'] }))
    router.get('/list', [AdminController, 'listAdmin']).use(middleware.auth({ guards: ['api_admin'] }))
    router.get('/logout', [AdminController, 'logout']).use(middleware.auth({ guards: ['api_admin'] }))
    //router.get('forgot-password/:email', [AdminController, 'forgotPassword'])
  })
  .prefix('/admin')
