# Book Commons API
[![Build Status](https://travis-ci.org/mattpeebles/book-commons-api.svg?branch=master)](https://travis-ci.org/mattpeebles/book-commons-api)

## Table of Contents

1. [Introduction](#introduction)
2. [TODO](#todo)
    1. [Ebook](#todoEbook)
    2. [Wishlist](#todoWishlist)
    3. [Users](#todoUsers)
3. [Routes](#routes)
	1. [Ebook](#routeEbook)
		1. [Get](#ebookGet)
		2. [Post](#ebookPost)
		3. [Put](#ebookPut)
		4. [Delete](#ebookDelete)
	2. [Wishlist](#routeWishlist)
		1. [Get](#wishlistGet)
		2. [Post](#wishlistPost)
		3. [Put](#wishlistPut)
		4. [Delete](#wishlistDelete)
	1. [Users](#routeUsers)
		1. [Get](#usersGet)
		2. [Post](#usersPost)
		3. [Put](#usersPut)
		4. [Delete](#usersDelete)

## Introduction <a name="introduction"></a>

This is a RESTful API backend for *Book Commons*, a public domain ebook aggregator. There are three routes - ebooks, wishlists, users - that can be accessed. A description of each of the paths, requirements, and results are below. 

## TODO <a name="todo"></a>

### Ebook Route <a name="todoEbook"></a>
:+1::tada::musical_note::confetti_ball:

### Wishlist Route <a name="todoWishlist"></a>
:+1::tada::musical_note::confetti_ball:

### Users Route <a name="todoUsers"></a>
:+1::tada::musical_note::confetti_ball:

-----------
## Routes <a name="routes"></a>

### Ebook <a name="routeEbook"></a>

#### Get <a name="ebookGet"></a>
`/ebooks`

lists all ebooks

`/ebooks/:bookId`

displays particular ebook

`/ebooks/wishlist/:listId`

returns all ebooks associated with listId

#### Post <a name="ebookPost"></a>
`/ebooks`

adds an ebook with values
- title
- author
- preview
- publishDate
- languages
- pages
- formats
- location
- locationIcon
- locationUrl

#### Put <a name="ebookPut"></a>
There is not a put route for ebooks. These ebook objects ideally and practically are immutable as they are pulled from outside databases.

#### Delete <a name="ebookDelete"></a>
`/ebooks/:bookId`

Removes ebook from database

-----------

### Wishlist <a name="routeWishlist"></a>

#### Get <a name="wishlistGet"></a>
`/wishlists`

lists all wishlists of user

`/wishlists/:listId`

displays particular list

#### Post <a name="wishlistPost"></a>
`/wishlists`

adds a new wishlist with values
- title
- items


#### Put <a name="wishlistPut"></a>
`wishlists/:listId`

- updates title of wishlist
- must have id of wishlist in request body passed in as listId

`/wishlists/:listId/add/:bookId`

- adds ebook id to items array
- must have id of wishlist in request body passed in as listId
- prevents duplicate ids from being added to same wishlist

`/wishlists/:listId/delete/:bookId`

- removes ebook from items array
- must have id of wishlist in request body passed in as listId


#### Delete <a name="wishlistDelete"></a>
`/wishlists/:listId`

- Removes wishlist from database
- currently does not remove ebooks from database

----------
### Users <a name="routeUsers"></a>

#### Login <a name="usersLogin"></a>
`/users/login`

- *post request*
- allows user to login
- initiates session

#### Logout <a name="usersLogout"></a>
`/users/logout/`

- *get request*
- logs user out
- ends session

#### Get <a name="usersGet"></a>
`/users/me` 

displays info of logged in user

#### Post <a name="usersPost"></a>
`/users`

ensures there are not duplicate emails in database before creating user
and hashes password

adds a new user with values that are accessible in client
- email
- wishlists


#### Put <a name="usersPut"></a>
`users/:userId`

- can update email and/or password of user
- must have id of user in request body passed in as userId

`/users/:userId/add/:listId`

- adds wishlist id to wishlists array
- must have id of user in request body passed in as userId

`users/:userId/delete/:listId`
- removes wishlist id from wishlist array
- must have id of user in request body passed in as userId


#### Delete <a name="usersDelete"></a>
`/users/:userId`

- Removes user from database
- currently does not remove list or ebooks from database
