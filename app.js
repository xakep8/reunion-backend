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
const verifyToken = require("./utils/verifyToken");
var bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

dotenv.config();

const saltRounds = 10;

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

app.post("/login", async (request, response) => {
  if (request.body.email == "") {
    return response.send("error");
  }
  if (request.body.password == "") {
    return response.send("error");
  }
  try {
    const user = await User.findOne({
      where: {
        email: request.body.email,
      },
    });
    if (!user) {
      return response.send("error");
    }
    const isMatch = await bcrypt.compare(request.body.password, user.password);
    if (!isMatch) {
      return response.send("error");
    }
    const authToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "12h", });
    const userData = user.id;
    return response.send({ userData, authToken });
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
  const pending = []; const done = [];
  todos.forEach(todo => {
    if (todo.completed) {
      done.push(todo.id);
    } else {
      pending.push(todo.id);
    }
  });
  const tasks = todos.reduce((acc, todo) => {
    acc[todo.id] = {
      "id": todo.id,
      "title": todo.title,
      "description": todo.description,
      "startDate": todo.startDate,
      "endDate": todo.endDate,
      "completed": todo.completed,
    };
    return acc;
  }, {});
  return response.json({
    "columns": {
      "pending": {
        "id": "pending",
        "taskIDs": pending,
        "title": "Pending",
      },
      "done": {
        "id": "done",
        "taskIDs": done,
        "title": "Done",
      }
    },
    tasks,
    "columnOrder": ["pending", "done"],
  });
});

app.post("/tasks", verifyToken, async function (request, response) {
  console.log("Creating a todo", request.body);
  if (request.body.title == "") {
    const error = "To-Dos cannot be blank";
    return response.status(422).json(error);
  }
  else if (request.body.startDate == "") {
    const error = "Date is required to make a To-Do";
    return response.status(422).json(error);
  }
  else if (request.body.endDate == "") {
    const error = "Date is required to make a To-Do";
    return response.status(422).json(error);
  }
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      description: request.body.description,
      startDate: request.body.startDate,
      endDate: request.body.endDate,
      userId: request.userId,
    });
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
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

app.put("/tasks/:id", verifyToken, async function (request, response) {
  console.log("Updating a todo", request.body);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const res = await todo.update({
      title: request.body.title,
      description: request.body.description,
      startDate: request.body.startDate,
      endDate: request.body.endDate,
    });
    return response.json(res);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.patch("/tasks/:id", verifyToken, async function (request, response) {
  console.log("Updating a todo", request.body);
  const todo = await Todo.findByPk(request.params.id);
  const state = request.body.state === 'done' ? true : false;
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
    await Todo.remove(request.params.id, request.userId);
    return response.json({ success: true });
  }
  catch (error) {
    return response.status(422).json(error);
  }
});

app.post("/verify", async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send('Token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).send('Invalid token: User does not exist');
    }
  } catch (error) {
    return res.status(401).send('Invalid or expired token');
  }
});

app.get("*", (req, res) => {
  res.send(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

module.exports = app;
