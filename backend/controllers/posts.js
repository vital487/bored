const db = require('../index').db
const keyPair = require('../index').keyPair
const router = require('express').Router()
const Joi = require('@hapi/joi')
const utils = require('../lib/utils')

/**
 * Create new text post
 */
router.post('/text', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        const schema = Joi.object({
            text: Joi.string().trim().max(255).min(5).required()
        })

        utils.validateSchema(req, res, schema, () => {
            //Check if user exists
            let userCheck = 'select id from users where username = ?'

            db.query(userCheck, req.user.username, (err, result) => {
                if (err) return res.sendStatus(400)
                if (result.length === 0) return res.sendStatus(400)

                //Insert new text post
                let insertPost = 'insert into posts set ?'

                let post = {
                    id: null,
                    user: req.user.username,
                    created_at: utils.getUnixTime(),
                    type: 'text'
                }

                db.query(insertPost, post, (err, result) => {
                    if (err) return res.sendStatus(400)
                    post.id = result.insertId

                    //Insert text post
                    let insertTextPost = 'insert into text_posts set ?'

                    let textPost = {
                        id: post.id,
                        text: req.body.text
                    }

                    db.query(insertTextPost, textPost, (err, result) => {
                        if (err) return res.sendStatus(400)
                        return res.json({ post, textPost })
                    })
                })
            })
        })
    })
})

module.exports = router