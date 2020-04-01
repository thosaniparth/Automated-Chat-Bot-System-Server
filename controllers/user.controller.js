let User = require('../models/user.model');
let Order = require('../models/order.model');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let config = require('../config');

exports.register = (req,res) =>
{
    let doc = req.body.user;
    if(doc)
    {
        let user = new User(doc);
        user.save()
        .then((result) =>
        {
            res.status(200).send({ message: "User Registered Successfully" });
        })
        .catch((err) =>
        {
            res.status(500).send({ message: "User Registeration Failed", error: err });
        });
    }
};

exports.login = (req,res) =>
{
    User.findOne({ email: req.body.email },(err,user) =>
    {
        if(err)
        {
            res.status(500).send({ message: "User Registeration Failed", error: err });
        }
        else
        {
            if(user)
            {
                var success = bcrypt.compareSync(String(req.body.password),user.password);
                if(success)
                {
                    jwt.sign({ email: user.email, address: user.address },config.jwtSecretKey,(er,token) =>
                    {
                        if(er)
                        {
                            res.status(500).send({ message: 'Authentication Failed', metaMessage: 'Token Generation Failed' });
                        }
                        else
                        {
                            res.status(200).send({ message: 'Login Successful', token: token });
                        }
                    });
                }
                else
                {
                    res.status(401).send({ message: "Wrong Password" });
                }
            }
            else
            {
                res.status(404).send({ message: "User Not Found" });
            }
        }
    });
};

exports.isNewUser = (req,res) =>
{
    Order.find({ email: req.email },(err,orders) =>
    {
        if(err)
        {
            res.status(500).send({ message: "Failed to fetch user information",error: err });
        }
        else
        {
            var newUser = true;
            if(orders.length==5)
            {
                newUser = false;
            }
            res.status(200).send({ new: newUser });
        }
    }).limit(5);
};