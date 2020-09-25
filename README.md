# votedotorg-state-site-tracking

## Developing

- Install [MongoDB](https://docs.mongodb.com/manual/installation/)
- `npm install`

### MongoDB

We have a cloud-hosted database in MongoDB Atlas. However, if you prefer using
your own local copy, you can follow the instructions [here](https://zellwk.com/blog/install-mongodb/)
to install your own.

### Environment variables

We use the dotenv package to to manage environment variables needed for things
like database connection details.

To setup connection to the database, copy the file `.env.template` to `.env`
and add the values for the fields. This will allow the scripts that need
to connect to the database to get the right connection info.
