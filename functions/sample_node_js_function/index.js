"use strict";
const catalyst = require("zcatalyst-sdk-node");
const express = require("express");
const app = express();
app.use(express.json());

const TABLE_NAME = "Todos";

app.get("/", (req, res) => {
  res.status(200).send("Hello World! Your Catalyst function is running.");
});

async function requireAuthenticatedUser(req, res, next) {
  try {
    const catalystApp = catalyst.initialize(req, { scope: "user" });
    const user = await catalystApp.userManagement().getCurrentUser();

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).send({ error: "Authentication required" });
    }

    req.catalystApp = catalystApp;
    req.catalystUser = user;
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    res.status(401).send({ error: "Authentication required" });
  }
}

app.use("/todos", requireAuthenticatedUser);

app.post("/todos", async (req, res) => {
  try {
    const catalystApp = req.catalystApp;
    const { title, description } = req.body;
    if (!title) return res.status(400).send({ error: "Title is required" });

    const rowData = {
      Title: title,
      Description: description || "",
      Completed: false,
    };
    const insertResp = await catalystApp
      .datastore()
      .table(TABLE_NAME)
      .insertRow(rowData);
    res.status(201).send({ message: "Todo created", data: insertResp });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to create todo" });
  }
});

app.get("/todos", async (req, res) => {
  try {
    const catalystApp = req.catalystApp;
    const query = `SELECT ROWID, Title, Description, Completed, CREATEDTIME 
                   FROM ${TABLE_NAME} 
                   WHERE IsDeleted = 'false'`;
    const rows = await catalystApp.zcql().executeZCQLQuery(query);
    const todos = rows.map((row) => row[TABLE_NAME]);
    res.status(200).send(todos);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to fetch todos" });
  }
});

app.get("/todos/:id", async (req, res) => {
  try {
    const catalystApp = req.catalystApp;
    const row = await catalystApp
      .datastore()
      .table(TABLE_NAME)
      .getRow(req.params.id);
    res.status(200).send(row);
  } catch (err) {
    console.log(err);
    res.status(404).send({ error: "Todo not found" });
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const catalystApp = req.catalystApp;
    const updates = { ROWID: req.params.id };

    if (req.body.title !== undefined) updates.Title = req.body.title;
    if (req.body.description !== undefined) updates.Description = req.body.description;
    if (req.body.completed !== undefined) updates.Completed = req.body.completed;

    const response = await catalystApp
      .datastore()
      .table(TABLE_NAME)
      .updateRow(updates);
    res.status(200).send(response);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update todo" });
  }
});

app.delete("/todos/:id", async (req, res) => {
  try {
    const catalystApp = req.catalystApp;
    const deleteResp = await catalystApp
      .datastore()
      .table(TABLE_NAME)
      .updateRow({ ROWID: req.params.id, IsDeleted: true });
    res.status(200).send({ message: "Todo deleted", data: deleteResp });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to delete todo" });
  }
});

module.exports = app;
