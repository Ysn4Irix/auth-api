const router = require('express').Router()
const verify = require('../verifyLogin')
const crud = require('../controllers/crudController')

/* Getting all */
router.get('/', verify, crud.getAllUsers)

/* Getting One */
router.get('/:id', verify, crud.getuser, crud.getOneUser)

/* update user data */
router.patch('/:id', verify, crud.getuser, crud.updateUser)

/* Deleting One */
router.delete('/:id', verify, crud.getuser, crud.deleteUser)

module.exports = router