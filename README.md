# Book Commons API

<<<<<<< HEAD
[TOC]

##TODO

### Ebook Route
- [ ] determine if ebooks collection should be a permanent collection

### Wishlist Route
- [ ] Remove ebooks from database that only exist in delete wishlist

### Users Route
=======
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

## TODO <a name="todo"></a>

### Ebook Route <a name="todoEbook"></a>
- [ ] determine if ebooks collection should be a permanent collection

### Wishlist Route <a name="todoWishlist"></a>
- [ ] Remove ebooks from database that only exist in delete wishlist

### Users Route <a name="todoUsers"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
- [ ] On wishlist remove, delete wishlist from database
- [ ] On account deletion, remove all wishlists, and all ebooks associated with account 

-----------
<<<<<<< HEAD
## Routes
Ebook
Wishlist
User

### Ebook

#### Get
=======
## Routes <a name="routes"></a>

### Ebook <a name="routeEbook"></a>

#### Get <a name="ebookGet"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/ebooks`
lists all ebooks

`/ebooks/:bookId`
displays ebook with id in parameter

<<<<<<< HEAD
#### Post
=======
#### Post <a name="ebookPost"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
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

<<<<<<< HEAD
#### Put
There is not put route for ebooks. These ebook objects ideally and practically are immutable as they are pulled from outside databases.

#### Delete
=======
#### Put <a name="ebookPut"></a>
There is not a put route for ebooks. These ebook objects ideally and practically are immutable as they are pulled from outside databases.

#### Delete <a name="ebookDelete"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/ebooks/:bookId`
Removes ebook from 

-----------

<<<<<<< HEAD
### Wishlist

#### Get
`/wishlists`
lists all wishlists

`/ebooks/:listId`
displays list with id in parameter

#### Post
=======
### Wishlist <a name="routeWishlist"></a>

#### Get <a name="wishlistGet"></a>
`/wishlists`
lists all wishlists

`/wishlists/:listId`
displays list with id in parameter

#### Post <a name="wishlistPost"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/wishlists`
adds a new wishlist with values
- title
- items


<<<<<<< HEAD
#### Put
=======
#### Put <a name="wishlistPut"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`wishlists/:listId`
updates title of wishlist
must have id of wishlist in request body

`/wishlists/:listId/add/:bookId`
adds ebook id to items array
must have id of wishlist in request body
prevents duplicate ids from being added to same wishlist

`/wishlists/:listId/delete/:bookId`
removes ebook from items array
must have id of wishlist in request body
if ebook only exists in this wishlist, then deletes ebook from database


<<<<<<< HEAD
#### Delete
=======
#### Delete <a name="wishlistDelete"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/wishlists/:listId`
Removes wishlist from database
currently does not remove ebooks from database

----------
<<<<<<< HEAD
### Users

#### Login
=======
### Users <a name="routeUsers"></a>

#### Login <a name="usersLogin"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/users/login`
*post request*
allows user to login
initiates session

<<<<<<< HEAD
#### Logout
`/users/logout/
=======
#### Logout <a name="usersLogout"></a>
`/users/logout/`
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
*get request*
logs user out
ends session

<<<<<<< HEAD
#### Get
`/users`
lists all users

`/users/me`
displays info of logged in user

#### Post
=======
#### Get <a name="usersGet"></a>
`/users`
lists all users

`/users/me` 
displays info of logged in user

#### Post <a name="usersPost"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/users`
ensures there are not duplicate emails in database before creating user
and hashes password

adds a new user with values that are accessible in client
- email
- wishlists


<<<<<<< HEAD
#### Put
=======
#### Put <a name="usersPut"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`users/:userId`
can update email and/or password of user
must have id of user in request body

`/users/:userId/add/:listId`
adds wishlist id to wishlists array
must have id of user in request body

`users/:userId/delete/:listId`
removes wishlist id from wishlist array
must have id of user in request body


<<<<<<< HEAD
#### Delete
=======
#### Delete <a name="usersDelete"></a>
>>>>>>> 722eedbb97ceaebee7449d870071ec9f28949e4d
`/users/:userId`
Removes user from database
currently does not remove list or ebooks from database
