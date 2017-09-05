# Book Commons API

[TOC]

##TODO

### Ebook Route
- [ ] determine if ebooks collection should be a permanent collection

### Wishlist Route
- [ ] Remove ebooks from database that only exist in delete wishlist

### Users Route
- [ ] On wishlist remove, delete wishlist from database
- [ ] On account deletion, remove all wishlists, and all ebooks associated with account 

-----------
## Routes
Ebook
Wishlist
User

### Ebook

#### Get
`/ebooks`
lists all ebooks

`/ebooks/:bookId`
displays ebook with id in parameter

#### Post
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

#### Put
There is not put route for ebooks. These ebook objects ideally and practically are immutable as they are pulled from outside databases.

#### Delete
`/ebooks/:bookId`
Removes ebook from 

-----------

### Wishlist

#### Get
`/wishlists`
lists all wishlists

`/ebooks/:listId`
displays list with id in parameter

#### Post
`/wishlists`
adds a new wishlist with values
- title
- items


#### Put
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


#### Delete
`/wishlists/:listId`
Removes wishlist from database
currently does not remove ebooks from database

----------
### Users

#### Login
`/users/login`
*post request*
allows user to login
initiates session

#### Logout
`/users/logout/
*get request*
logs user out
ends session

#### Get
`/users`
lists all users

`/users/me`
displays info of logged in user

#### Post
`/users`
ensures there are not duplicate emails in database before creating user
and hashes password

adds a new user with values that are accessible in client
- email
- wishlists


#### Put
`users/:userId`
can update email and/or password of user
must have id of user in request body

`/users/:userId/add/:listId`
adds wishlist id to wishlists array
must have id of user in request body

`users/:userId/delete/:listId`
removes wishlist id from wishlist array
must have id of user in request body


#### Delete
`/users/:userId`
Removes user from database
currently does not remove list or ebooks from database
