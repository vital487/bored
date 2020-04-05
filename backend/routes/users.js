const db = require('../index').db
const router = require('express').Router()
const Joi = require('@hapi/joi')
const crypto = require('crypto')
const fs = require('fs')
const IMAGEDIR = './files/images/'
const VIDEODIR = './files/videos/'

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
        //Query error
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
            //Query error
            if (err) return res.sendStatus(400)
            user.id = result.insertId
            delete user.password
            return res.status(201).json({ user })
        })
    })
})

/**
 * Get user posts
 */
router.get('/:username/posts', (req, res) => {
    //Check if username exists
    let checkUsername = 'select id from users where username = ?'

    db.query(checkUsername, req.params.username, (err, result) => {
        //Query error
        if (err) return res.sendStatus(400)
        //If no results === if no user with that username
        if (result.length === 0) return res.sendStatus(400)

        //Get posts from that user
        let getPosts = 'select p.id, p.user, p.created_at, p.type, a.text as data from posts p, (select * from text_posts union all select * from image_posts u union all select * from video_posts) as a where p.user = ? and p.id = a.id'

        db.query(getPosts, req.params.username, (err, result) => {
            //Query error
            if (err) return res.sendStatus(400)

            //Get data from all files for image or video posts
            for (let i = 0; i < result.length; i++) {
                if (result[i].type === 'image') {
                    //Read image file
                    let binary = fs.readFileSync(IMAGEDIR + result[i].data)
                    //Binary data read from file to base64
                    result[i].data = new Buffer.from(binary).toString('base64')
                }
                else if (result[i].type === 'video') {
                    //Read video file
                    let binary = fs.readFileSync(VIDEODIR + result[i].data)
                    //Binary data read from file to base64
                    result[i].data = new Buffer.from(binary).toString('base64')
                }
            }

            return res.json({ posts: result })
        })
    })
})

module.exports = router