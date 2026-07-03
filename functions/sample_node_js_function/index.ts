import "dotenv/config";
import catalyst from "zcatalyst-sdk-node";
import express, { Request, Response, NextFunction } from "express";
import { connectMongo } from "./config/db";
import { TodoModel } from "./models/todo.model";
import { AuthenticatedRequest } from "./interfaces";

const app = express();
app.use(express.json());

connectMongo().catch((err) => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});


app.get("/", (_req: Request, res: Response): void => {
  res.status(200).send("Hello World! Your Catalyst function is running.");
});


async function requireAuthenticatedUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const catalystApp = catalyst.initialize(req as any, { scope: "user" });
    const user: any = await catalystApp.userManagement().getCurrentUser();

    if (!user || user.status !== "ACTIVE") {
      res.status(401).send({ error: "Authentication required" });
      return;
    }

    req.catalystUser = user;
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    res.status(401).send({ error: "Authentication required" });
  }
}

app.use("/todos", requireAuthenticatedUser as express.RequestHandler);


app.post("/todos", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body as { title?: string; description?: string };

    if (!title) {
      res.status(400).send({ error: "Title is required" });
      return;
    }

    const todo = await TodoModel.create({ title, description: description ?? "" });
    res.status(201).send({ message: "Todo created", data: todo });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to create todo" });
  }
});


app.get("/todos", async (_req: Request, res: Response): Promise<void> => {
  try {
    const todos = await TodoModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).send(todos);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch todos" });
  }
});


app.get("/todos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const todo = await TodoModel.findOne({ _id: req.params.id, isDeleted: false });

    if (!todo) {
      res.status(404).send({ error: "Todo not found" });
      return;
    }

    res.status(200).send(todo);
  } catch (err) {
    console.error(err);
    res.status(404).send({ error: "Todo not found" });
  }
});


app.put("/todos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, completed } = req.body as {
      title?: string;
      description?: string;
      completed?: boolean;
    };

    const updates: Partial<{ title: string; description: string; completed: boolean }> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (completed !== undefined) updates.completed = completed;

    const updated = await TodoModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).send({ error: "Todo not found" });
      return;
    }

    res.status(200).send(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update todo" });
  }
});


app.delete("/todos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await TodoModel.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!deleted) {
      res.status(404).send({ error: "Todo not found" });
      return;
    }

    res.status(200).send({ message: "Todo deleted", data: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete todo" });
  }
});

export = app;
