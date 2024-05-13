const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("portfolio");
    const collection = db.collection("users");
    const projectsCollection = db.collection("projects");
    const skillsCollection = db.collection("skills");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================

    // Projects
    app.post("/api/v1/projects", async (req, res) => {
      try {
        const {
          title,
          description,
          image,
          liveSite,
          clientGithub,
          serverGithub,
        } = req.body;

        // Insert the new product into the MongoDB collection
        const result = await projectsCollection.insertOne({
          title,
          description,
          image,
          liveSite,
          clientGithub,
          serverGithub,
        });

        res.status(201).json({
          message: "Project added successfully",
          projectsId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding project:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/v1/projects", async (req, res) => {
      try {
        const projects = await projectsCollection.find({}).toArray();
        res.json(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/v1/projects/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const projects = await projectsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!projects) {
          return res.status(404).json({ error: "projects not found" });
        }
        res.json(projects);
      } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Projects end

    // Skills start
    app.post("/api/v1/skills", async (req, res) => {
      try {
        const { title, image } = req.body;

        // Insert the new product into the MongoDB collection
        const result = await skillsCollection.insertOne({
          title,
          image,
        });

        res.status(201).json({
          message: "Skill added successfully",
          skillId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding skill:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/v1/skills", async (req, res) => {
      try {
        const skills = await skillsCollection.find({}).toArray();
        res.json(skills);
      } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Skills end

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
