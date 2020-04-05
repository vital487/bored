const db = require('../index').db
const keyPair = require('../index').keyPair
const router = require('express').Router()
const Joi = require('@hapi/joi')
const fs = require('fs')
const utils = require('../lib/utils')
const uniqid = require('uniqid')
const multer = require('multer')

const IMAGEDIR = './files/images/'
const VIDEODIR = './files/videos/'

const imageStorage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, IMAGEDIR)
    },
    filename: (req, file, next) => {
        next(null, `${req.id}.${file.originalname.split('.')[1]}`)
    }
})

const videoStorage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, VIDEODIR)
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

/*
##########
POSTS
########## 
*/


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

        //Convert post from string to int
        req.params.post = parseInt(req.params.post)

        //Does post and user exist?
        let postUserExists = 'select p.type from posts p, users u where p.id = ? and p.user = ? and u.username = ?'

        db.query(postUserExists, [req.params.post, req.user.username, req.user.username], (err, result) => {
            //Query error
            if (err) return res.sendStatus(400)
            //If post or user does not exist or authenticated user is not the owner
            if (result.length === 0) return res.sendStatus(400)

            //Get file path
            switch (result[0].type) {
                case 'text':
                    deletePost(req.params.post)
                    break;
                case 'image':
                    let getImagePath = 'select path from image_posts where id = ?'

                    db.query(getImagePath, req.params.post, (err, result) => {
                        //Query error
                        if (err) return res.sendStatus(400)
                        //If no results
                        if (result.length === 0) return res.sendStatus(400)

                        //Delete post
                        deletePost(req.params.post)

                        //Delete file
                        fs.unlinkSync(IMAGEDIR + result[0].path)
                    })
                    break;
                case 'video':
                    let getVideoPath = 'select path from video_posts where id = ?'

                    db.query(getVideoPath, req.params.post, (err, result) => {
                        //Query error
                        if (err) return res.sendStatus(400)
                        //If no results
                        if (result.length === 0) return res.sendStatus(400)

                        //Delete post
                        deletePost(req.params.post)

                        //Delete file
                        fs.unlinkSync(VIDEODIR + result[0].path)
                    })
                    break;
                default:
            }


        })
    })

    function deletePost(post) {
        //Delete post
        let deletePost = 'delete from posts where id = ?'

        db.query(deletePost, post, (err, result) => {
            //Query error
            if (err) return res.sendStatus(400)
            return res.sendStatus(204)
        })
    }
})

/**
 * Get post
 */
router.get('/:post', (req, res) => {
    //Is post param a number?
    if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

    //Convert post from string to int
    req.params.post = parseInt(req.params.post)

    //Get post
    let selectPostType = 'select type from posts where id = ?'

    db.query(selectPostType, req.params.post, (err, result) => {
        //Query error
        if (err) return res.sendStatus(400)
        //Post does not exist
        if (result.length === 0) return res.sendStatus(400)

        switch (result[0].type) {
            case 'text':
                let getTextPost = 'select p.id, p.user, p.created_at, p.type, t.text as data from posts p, text_posts t where p.id = t.id and t.id = ?'

                db.query(getTextPost, req.params.post, (err, result) => {
                    //Query error
                    if (err) return res.sendStatus(400)
                    //If no results
                    if (result.length === 0) return res.sendStatus(400)
                    return res.json({ post: result[0] })
                })
                break;
            case 'image':
                let getImage = 'select p.id, p.user, p.created_at, p.type, i.path as data from posts p, image_posts i where p.id = i.id and i.id = ?'

                db.query(getImage, req.params.post, (err, result) => {
                    //Query error
                    if (err) return res.sendStatus(400)
                    //If no results
                    if (result.length === 0) return res.sendStatus(400)

                    let post = result[0]

                    let binary = fs.readFileSync(IMAGEDIR + post.data)
                    //Binary data read from file to base64
                    post.data = new Buffer.from(binary).toString('base64')
                    return res.json({ post })
                })
                break;
            case 'video':
                let getVideo = 'select p.id, p.user, p.created_at, p.type, v.path as data from posts p, video_posts v where p.id = v.id and v.id = ?'

                db.query(getVideo, req.params.post, (err, result) => {
                    //Query error
                    if (err) return res.sendStatus(400)
                    //If no results
                    if (result.length === 0) return res.sendStatus(400)

                    let post = result[0]

                    let binary = fs.readFileSync(VIDEODIR + post.data)
                    //Binary data read from file to base64
                    post.data = new Buffer.from(binary).toString('base64')
                    return res.json({ post })
                })
                break;
            default:
        }
    })
})

/**
 * Get 10 posts by page
 */
router.get('/', (req, res) => {
    //Is page query a number?
    if (!utils.isNumber(req.query.page)) return res.sendStatus(400)

    //Convert page from string to int
    req.query.page = parseInt(req.query.page)

    //Get posts
    let getPosts = 'select p.id, p.user, p.created_at, p.type, a.text as data from posts p, (select * from text_posts union all select * from image_posts u union all select * from video_posts) as a where p.id = a.id order by p.created_at desc limit ?, 10'

    db.query(getPosts, req.query.page * 10, (err, result) => {
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

/*
##########
REACTIONS
########## 
*/

/**
 * Returns post reactions
 */
router.get('/:post/reactions', (req, res) => {
    //Is post param a number?
    if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

    //Convert post from string to int
    req.params.post = parseInt(req.params.post)

    //Get reactions
    let selectReactions = 'select * from reactions where post = ?'

    db.query(selectReactions, req.params.post, (err, result) => {
        //Query error
        if (err) return res.sendStatus(400)
        return res.json({ reactions: result })
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

/*
##########
COMMENTS
########## 
*/

/**
 * Create comment.
 */
router.post('/:post/comments', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        const schema = Joi.object({
            comment: Joi.string().trim().max(500).required()
        })

        utils.validateSchema(req, res, schema, () => {
            //Is post param a number?
            if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

            //Convert post from string to int
            req.params.post = parseInt(req.params.post)

            //Does post and user exist?
            let postUserExists = 'select p.id from posts p, users u where p.id = ? and u.username = ?'

            db.query(postUserExists, [req.params.post, req.user.username], (err, result) => {
                //Query error
                if (err) return res.sendStatus(400)
                //If post or user does not exist
                if (result.length === 0) return res.sendStatus(400)

                //Insert new comment
                let insertComment = 'insert into comments set ?'

                let comment = {
                    id: null,
                    post: req.params.post,
                    user: req.user.username,
                    comment: req.body.comment,
                    created_at: utils.getUnixTime()
                }

                db.query(insertComment, comment, (err, result) => {
                    //Query error
                    if (err) return res.sendStatus(400)
                    comment.id = result.insertId
                    return res.status(201).json({ comment })
                })
            })
        })
    })
})

/**
 * Get post comments
 */
router.get('/:post/comments', (req, res) => {
    //Is post param a number?
    if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

    //Convert post from string to int
    req.params.post = parseInt(req.params.post)

    //Get reactions
    let selectComments = 'select * from comments where post = ?'

    db.query(selectComments, req.params.post, (err, result) => {
        //Query error
        if (err) return res.sendStatus(400)
        return res.json({ comments: result })
    })
})

/**
 * Delete comment
 */
router.delete('/:post/comments/:comment', (req, res) => {
    utils.getVerifyToken(req, res, keyPair.pub, () => {
        //Is post param a number?
        if (!utils.isNumber(req.params.post)) return res.sendStatus(400)

        //Is comment param a number?
        if (!utils.isNumber(req.params.comment)) return res.sendStatus(400)

        //Convert post from string to int
        req.params.post = parseInt(req.params.post)
        //Convert comment from string to int
        req.params.comment = parseInt(req.params.comment)

        //Does post and user and comment exist?
        let postUserCommentExists = 'select c.id from users u, comments c where c.id = ? and c.post = ? and c.user = ? and u.username = ?'

        db.query(postUserCommentExists, [req.params.comment, req.params.post, req.user.username, req.user.username], (err, result) => {
            //Query error
            if (err) return res.sendStatus(400)
            //If post, user or comment does not exist
            if (result.length === 0) return res.sendStatus(400)
            
            //Delete comment
            let deleteComment = 'delete from comments where id = ?'

            db.query(deleteComment, req.params.comment, (err, result) => {
                //Query error
                if (err) return res.sendStatus(400)
                return res.sendStatus(204)
            })
        })
    })
})

module.exports = router