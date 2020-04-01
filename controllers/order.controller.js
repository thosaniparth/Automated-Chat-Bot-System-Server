const Order = require('../models/order.model');

exports.getAllOrders = (req,res) =>
{
    Order.find({ email: req.email },{ _id: 0, _v: 0,email: 0 },(err,orders) =>
    {
        if(err)
        {
            res.status(500).send({ message: "Error while fetching past orders" });
        }
        else
        {
            res.status(200).send(orders);
        }
    }).sort({ timestamp: -1 });
};