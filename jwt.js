let jwt = require('jsonwebtoken');
let config = require('./config');
exports.verifyToken = (req, res, next) =>
{
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined')
    {
        const bearer = bearerHeader.split(' ');
        jwt.verify(bearer[1],config.jwtSecretKey, (err, d) =>
        {
            if(!err)
            {
                req.email = d.email;
                next();
            }
            else
            {
                res.sendStatus(403);
            }
        });
    }
    else
    {
        res.sendStatus(403);
    }
}