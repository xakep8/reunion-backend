const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const ApiError = require("./utils/ApiError");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const httpStatus = require('http-status');
var bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

dotenv.config();



const saltRounds = 10;

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Unauthorized request');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    next();
  }
  catch (error) {
    return res.status(401).send('Unauthorized request');
  }
}

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));


app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  if (request.body.name == "") {
    return response.send("error");
  }
  if (request.body.email == "") {
    return response.send("error");
  }
  if (request.body.password == "" || request.body.password.length < 6) {
    return response.send("error");
  }
  try {
    await User.create({
      name: request.body.name,
      email: request.body.email,
      password: hashedPwd,
    }).then((user) => {
      const authToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "12h", });
      const userData = user.id;
      return response.send({ userData, authToken });
    }).catch((error) => {
      console.log(error);
      return response.send("error");
    });
  }
  catch (error) {
    console.log(error);
    return response.send("error");
  }
});

app.get("/tasks", verifyToken, async function (request, response) {
  const acc = await User.findByPk(request.userId);
  const userName = acc.name;
  const todos = await Todo.getTodos(request.userId);
  return response.json({
    todos,
    userName,
  });
});

app.get("/tasks/:id", verifyToken, async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/tasks", verifyToken, async function (request, response) {
  console.log("Creating a todo", request.body);
  console.log(request.user);
  if (request.body.title == "") {
    const error="To-Dos cannot be blank";
    return response.status(422).json(error);
  }
  else if (request.body.startDate == "") {
    const error= "Date is required to make a To-Do";
    return response.status(422).json(error);
  }
  else if (request.body.endDate == "") {
    const error="Date is required to make a To-Do";
    return response.status(422).json(error);
  }
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.userId,
    });
    return response.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/tasks/:id", verifyToken, async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  const state = request.body.completed === true ? false : true;
  try {
    const res = await todo.setCompletionStatus(state);
    return response.json(res);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/tasks/:id", verifyToken, async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  console.log("Delete a todo by ID", request.params.id);
  try {
    await Todo.remove(request.params.id, request.user.id);
    return response.json({ success: true });
  }
  catch (error) {
    return response.status(422).json(error);
  }
});

app.get("/test_todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("*", (req, res) => {
  res.send(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

module.exports = app;
