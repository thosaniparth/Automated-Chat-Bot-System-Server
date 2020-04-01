let express = require('express');
let router = express.Router();
let userController = require('../controllers/user.controller');
let auth = require('../jwt');

router.post('/login',userController.login);
router.post('/register',userController.register);
router.get('/isNewUser',auth.verifyToken,userController.isNewUser);

module.exports = router;