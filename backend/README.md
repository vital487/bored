# Bored API

## Login

### Get token

#### Endpoint

POST /api/login

Gets token to use the API reserved endpoints.

#### Body

JSON
```
{
    username: Joi.string().trim().max(20).min(3).required(),
    password: Joi.string().min(3).max(20).required()
}
```

#### Return

JSON
```
{
    token: token
}
```

## Users

### Create User

#### Endpoint

POST /api/users

#### Body

JSON
```
{
    username: Joi.string().trim().max(20).min(3).required(),
    password: Joi.string().min(3).max(20).required()
}
```

#### Return

JSON
```
{
    id: 1,
    username: "manel"
}
```

## Posts

### Get post

#### Endpoint

GET /api/posts/:post

#### Return

JSON
```
{
    "post": {
        "id": 1,
        "user": "manel",
        "created_at": 1585642389,
        "type": "video",
        "data": "feolkfjoeijewf"
    }
}
```

### Get posts by page

#### Endpoint

GET /api/posts/?page=0

Each page has 10 posts. Pages start on 0.

#### Return

JSON
```
{
    "posts": [
        {
            "id": 6,
            "user": "manel",
            "created_at": 1585745515,
            "type": "image",
            "data": "fpwekfpoewgf"
        },
        {
            "id": 4,
            "user": "manel",
            "created_at": 1585745508,
            "type": "image",
            "data": "grthtyjy"
        },
        {
            "id": 3,
            "user": "manel",
            "created_at": 1585745475,
            "type": "text",
            "data": "post de bosta"
        }
    ]
}
```

### Get posts from a specific user

#### Endpoint

GET /api/users/:username/posts

#### Return

JSON
```
{
    "posts": [
        {
            "id": 3,
            "user": "manel",
            "created_at": 1585745475,
            "type": "text",
            "data": "post de bosta"
        },
        {
            "id": 4,
            "user": "manel",
            "created_at": 1585745508,
            "type": "image",
            "data": "h65h56hj6j"
        },
        {
            "id": 6,
            "user": "manel",
            "created_at": 1585745515,
            "type": "video",
            "data": "gtkrhrohh4"
        }
    ]
}
```

### Create text post

#### Endpoint

POST /api/posts/text

#### Authorization

Bearer token

#### Body

JSON
```
{
    text: Joi.string().trim().max(255).min(5).required()
}
```

#### Return

JSON
```
{
    post: 
        {
            id: 1,
            user: "manel",
            created_at: 1578945654,
            type: 'text'
        },
    textPost:
        {
            id: 1,
            text: "Olá"
        }
}
```

### Create image post

#### Endpoint

POST /api/posts/image

Creates image post.

#### Authorization

Bearer token

#### Body

FORM-DATA
```
image: 'image/jpeg' || 'image/png'
```

#### Return

JSON
```
{
    post:
        {
            id: 1,
            user: "manel",
            created_at: 1578945654,
            type: 'image'
        }
}
```

### Create videos post

#### Endpoint

POST /api/posts/video

Creates video post.

#### Authorization

Bearer token

#### Body

FORM-DATA
```
video: 'video/mp4' || 'video/x-msvideo'
```

#### Return

JSON
```
{
    post:
        {
            id: 1,
            user: "manel",
            created_at: 1578945654,
            type: 'video'
        }
}
```

### Delete post

#### Endpoint

DELETE /api/post/:post

#### Authorization

Bearer token

## Reactions

### Get reactions from post

#### Endpoint

GET /api/posts/:post/reactions

#### Return

JSON
```
{
    "reactions": [
        {
            "id": 3,
            "post": 1,
            "user": "manel",
            "reaction": "amazing"
        }
    ]
}
```

### Add reaction to post

#### Endpoint

POST /api/posts/:post/reactions

Reacts to a post. If reaction does not exist, creates it. If exists and changes to other reactions, modifies it. If exists and change to the same reaction, deletes it.

#### Authorization

Bearer token

#### Body

JSON
```
{
    reaction: Joi.string().valid('amazing', 'good', 'meh', 'bad').required()
}
```

#### Return

JSON
```
{
    reaction:
        {
            id: 1,
            post: 1,
            user: "manel",
            reaction: "amazing"
        }
}
```

## Comments

### Get comments from post

#### Endpoint

GET /api/posts/:post/comments

#### Return

JSON
```
{
    "comments": [
        {
            "id": 1,
            "post": 1,
            "user": "manel",
            "comment": "really good",
            "created_at": 1585656450
        },
        {
            "id": 2,
            "post": 1,
            "user": "manel",
            "comment": "it sucks",
            "created_at": 1585656481
        }
    ]
}
```

### Create comment

#### Endpoint

POST /api/posts/:post/comments

#### Authorization

Bearer token

#### Body

JSON
```
{
    comment: Joi.string().trim().max(500).required()
}
```

#### Return

JSON
```
{
    comment: {
        id: 3,
        post: 1,
        user: "manel",
        comment: "ehehe",
        created_at: 1585663918
    }
}
```

### Delete comment

#### Endpoint

POST /api/posts/:post/comments/:comment

#### Authorization

Bearer token