require('dotenv').config();

module.exports = {
  development: {
    username: "postgres",
    password: "changeme",
    database: "wd-todo-dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: "changeme",
    database: "wd-todo-test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    url: process.env.DATABASE_URL,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};