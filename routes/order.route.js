let express = require('express');
let router = express.Router();
let orderController = require('../controllers/order.controller');
let auth = require('../jwt');

router.get('/getAllOrders',auth.verifyToken,orderController.getAllOrders);

module.exports = router;