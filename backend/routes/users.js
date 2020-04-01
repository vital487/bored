const db = require('../index').db
const router = require('express').Router()
const Joi = require('@hapi/joi')
const crypto = require('crypto')

/**
 * Create new user
 */
router.post('/', (req, res) => {
    const schema = Joi.object({
        username: Joi.string().trim().max(20).min(3).required(),
        password: Joi.string().min(3).max(20).required()
    })

    const validSchema = schema.validate(req.body)

    if (validSchema.error) return res.status(400).json(validSchema.error)

    const checkUsername = 'select * from users where username = ?'

    db.query(checkUsername, req.body.username, (err, result) => {
        if (err) return res.sendStatus(400)
        if (result.length > 0) return res.sendStatus(400)

        let user = {
            id: null,
            username: req.body.username,
            password: crypto
                .createHash('sha256')
                .update(req.body.password)
                .digest('base64')
        }

        const insertUser = 'insert into users set ?'

        db.query(insertUser, user, (err, result) => {
            if (err) return res.sendStatus(400)
            user.id = result.insertId
            delete user.password
            return res.status(201).json(user)
        })
    })
})

/**
 * Get user posts
 */
router.get('/:username/posts', (req, res) => {
    
})

module.exports = router