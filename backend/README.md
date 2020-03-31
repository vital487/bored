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

{
    token: <token>
}

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

### Create text post

#### Endpoint

POST /api/posts/text

#### Authorization

Bearer <token>

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

Bearer <token>

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

#### Endpoint

POST /api/posts/video

Creates video post.

#### Authorization

Bearer <token>

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

Bearer <token>

### Reaction a post

#### Endpoint

POST /api/posts/:post/reactions

Reacts to a post. If reaction does not exist, creates it. If exists and changes to other reactions, modifies it. If exists and change to the same reaction, deletes it.

#### Authorization

Bearer <token>

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