import router from '@adonisjs/core/services/router'
import AdminController from '#controllers/admin_controller'
//import { middleware } from '#start/kernel'

router
  .group(() => {
    router.post('login', [AdminController, 'login'])
    router.post('create-admin', [AdminController, 'adminCreation'])
    router.get('forgot-password/:email', [AdminController, 'forgotPassword'])
  })
  .prefix('/admin')
