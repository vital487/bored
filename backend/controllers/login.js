const db = require('../index').db
const keyPair = require('../index').keyPair
const router = require('express').Router()
const Joi = require('@hapi/joi')
const crypto = require('crypto')
const utils = require('../lib/utils')

router.post('/', (req, res) => {
    const schema = Joi.object({
        username: Joi.string().max(20).min(3).required(),
        password: Joi.string().min(3).max(20).required()
    })

    utils.validateSchema(req, res, schema, () => {
        const userExists = 'select id, password from users where username = ?'

        db.query(userExists, req.body.username, (err, result) => {
            if (err) return res.sendStatus(400)
            if (result.length === 0) return res.sendStatus(400)

            let hash = crypto
                .createHash('sha256')
                .update(req.body.password)
                .digest('base64')

            if (hash !== result[0].password) return res.sendStatus(400)
            
            utils.generateToken(res, { id: result[0].id, username: req.body.username }, keyPair.priv, (token) => {
                return res.json({ token })
            })
        })
    })
})

module.exports = router