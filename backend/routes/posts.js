const db = require('../index').db
const keyPair = require('../index').keyPair
const router = require('express').Router()
const Joi = require('@hapi/joi')
const utils = require('../lib/utils')
const uniqid = require('uniqid')
const multer = require('multer')

const imageStorage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, './files/images/')
    },
    filename: (req, file, next) => {
        next(null, `${req.id}.${file.originalname.split('.')[1]}`)
    }
})

const videoStorage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, './files/videos/')
    },
    filename: (req, file, next) => {
        next(null, `${req.id}.${file.originalname.split('.')[1]}`)
    }
})

const imageFilter = (req, file, next) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') next(null, true)
    else next(new Error('Bad mimetype'), false)
}

const videoFilter = (req, file, next) => {
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/x-msvideo') next(null, true)
    else next(new Error('Bad mimetype'), false)
}

const uploadImage = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1024 * 1024 * 5,
        files: 1
    },
    fileFilter: imageFilter
})
const uploadVideo = multer({
    storage: videoStorage,
    limits: {
        fileSize: 1024 * 1024 * 50,
        files: 1
    },
    fileFilter: videoFilter
})

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
                        return res.status(201).json({ post, textPost })
                    })
                })
            })
        })
    })
})

/**
 * Create new image post
 */
router.post('/image', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        //Check if user exists
        let userCheck = 'select id from users where username = ?'

        db.query(userCheck, req.user.username, (err, result) => {
            if (err) return res.sendStatus(400)
            if (result.length === 0) return res.sendStatus(400)

            req.id = uniqid(req.user.username)

            //Save image
            uploadImage.single('image')(req, res, (err) => {
                if (err) return res.sendStatus(400)

                //Insert new post
                let insertPost = 'insert into posts set ?'

                let post = {
                    id: null,
                    user: req.user.username,
                    created_at: utils.getUnixTime(),
                    type: 'image'
                }

                db.query(insertPost, post, (err, result) => {
                    if (err) return res.sendStatus(400)
                    post.id = result.insertId
                    req.id = post.id

                    //Insert new image post
                    let insertImagePost = 'insert into image_posts set ?'

                    let imagePost = {
                        id: post.id,
                        path: req.file.filename
                    }

                    db.query(insertImagePost, imagePost, (err, result) => {
                        if (err) return res.sendStatus(400)
                        return res.status(201).json(post)
                    })
                })
            })
        })
    })
})

/**
 * Create new video post
 */
router.post('/video', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        //Check if user exists
        let userCheck = 'select id from users where username = ?'

        db.query(userCheck, req.user.username, (err, result) => {
            if (err) return res.sendStatus(400)
            if (result.length === 0) return res.sendStatus(400)

            req.id = uniqid(req.user.username)

            //Save video
            uploadVideo.single('video')(req, res, (err) => {
                if (err) return res.sendStatus(400)

                //Insert new post
                let insertPost = 'insert into posts set ?'

                let post = {
                    id: null,
                    user: req.user.username,
                    created_at: utils.getUnixTime(),
                    type: 'video'
                }

                db.query(insertPost, post, (err, result) => {
                    if (err) return res.sendStatus(400)
                    post.id = result.insertId
                    req.id = post.id

                    //Insert new image post
                    let insertVideoPost = 'insert into video_posts set ?'

                    let videoPost = {
                        id: post.id,
                        path: req.file.filename
                    }

                    db.query(insertVideoPost, videoPost, (err, result) => {
                        if (err) return res.sendStatus(400)
                        return res.status(201).json(post)
                    })
                })
            })
        })
    })
})

/**
 * Delete post
 */
router.delete('/:post', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        //Is post param a number?
        if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

        //Does post and user exist?
        let postUserExists = 'select p.type from posts p, user u where p.id = ? and p.user = ? and u.username = ?'

        db.query(postUserExists, [req.params.post, req.user.username, req.user.username], (err, result) => {
            //Query error
            if (err) return res.sendStatus(400)
            //If post or user does not exist or authenticated user is not the owner
            if (result.length === 0) return res.sendStatus(400)

            //Delete post
            let deletePost

            switch (result[0].type) {
                case 'text':
                    deletePost = 'delete from text_posts where id = ?; delete from posts where id = ?'
                    break;
                case 'image':
                    deletePost = 'delete from image_posts where id = ?; delete from posts where id = ?'
                    break;
                case 'video':
                    deletePost = 'delete from video_posts where id = ?; delete from posts where id = ?'
                    break;
                default:
            }

            db.query(deletePost, [req.params.post, req.params.post], (err, result) => {
                //Query error
                if (err) return res.sendStatus(400)
                return res.sendStatus(204)
            })
        })
    })
})

/**
 * Create/change/delete reaction to a post.
 * 
 * If reaction does not exist, creates it.
 * If reaction exists and will change ofr a different state, change it.
 * If reaction exists and will change for the same state, delete it.
 */
router.post('/:post/reactions', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        const schema = Joi.object({
            reaction: Joi.string().valid('amazing', 'good', 'meh', 'bad').required()
        })

        utils.validateSchema(req, res, schema, () => {
            //Is post param a number?
            if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

            //Does post and user exist?
            let postUserExists = 'select p.id from posts p, users u where p.id = ? and u.username = ?'

            db.query(postUserExists, [req.params.post, req.user.username], (err, result) => {
                //Query error
                if (err) return res.sendStatus(400)
                //If post or user does not exist
                if (result.length === 0) return res.sendStatus(400)

                //Insert/modify reaction
                let reactionExists = 'select id, reaction from reactions where post = ? and user = ?'

                db.query(reactionExists, [req.params.post, req.user.username], (err, result) => {
                    //Query error
                    if (err) return res.sendStatus(400)

                    //Insert reaction
                    if (result.length === 0) {
                        let insertReaction = 'insert into reactions set ?'

                        let reaction = {
                            id: null,
                            post: req.params.post,
                            user: req.user.username,
                            reaction: req.body.reaction
                        }

                        db.query(insertReaction, reaction, (err, result) => {
                            //Query error
                            if (err) return res.sendStatus(400)
                            reaction.id = result.insertId
                            return res.status(201).json({ reaction })
                        })
                    }
                    //Update reaction
                    else {
                        //If updating to the same reaction, delete it
                        if (result[0].reaction === req.body.reaction) {
                            let deleteReaction = 'delete from reactions where post = ? and user = ?'

                            db.query(deleteReaction, [req.params.post, req.user.username], (err, result) => {
                                //Query error
                                if (err) return res.sendStatus(400)
                                return res.sendStatus(204)
                            })
                        }
                        //If updating to a new reaction
                        else {
                            let updateReaction = 'update reactions set reaction = ? where post = ? and user = ?'

                            let reaction = {
                                id: result[0].id,
                                post: req.params.post,
                                user: req.user.username,
                                reaction: req.body.reaction
                            }

                            db.query(updateReaction, [req.body.reaction, req.params.post, req.user.username], (err, result) => {
                                //Query error
                                if (err) return res.sendStatus(400)
                                return res.json({ reaction })
                            })
                        }
                    }
                })
            })
        })
    })
})

module.exports = router