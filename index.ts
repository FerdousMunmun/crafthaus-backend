const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


// start point
const express = require("express");
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
import type {
  Request,
  Response,
  NextFunction,
} from "express";

interface AuthRequest extends Request {
  user?: any;
}

interface AuthRequest extends Request {
  user?: any;
}

dontenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use(cors())





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
app.get("/", (req: Request, res: Response)=> {
  res.send("Server is running fine!");
});

// mongodb start
const uri = process.env.MONGO_DB_URI!;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// jwt create

// const JWKS = createRemoteJWKSet(
//   new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
// );


// const verifyToken = async ( req: AuthRequest,
//   res: Response,
//   next: NextFunction) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       message: "Unauthorized",
//     });
//   }

//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
//   try {

//     const { payload } = await jwtVerify(token, JWKS);
//     req.user = payload;

//     next();
//   } catch (error: any) {
//         console.error(error);

//     return res.status(403).json({
//       msg: "Unauthorized"
//     });
//   }
// };


async function run() {
  try {

    // await client.connect();

    // mongodbcollection
    console.log("MongoDB Connected");
    const db = client.db("crafthaus_db");

    const projectsCollection = db.collection("projects");
    const servicesCollection = db.collection("services");
    const blogsCollection = db.collection("blogs");

    app.get("/projects", async (req: Request, res: Response) => {
  try {
    const projects = await projectsCollection
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
});
app.get("/services", async (req: Request, res: Response) => {
  try {
    const services = await servicesCollection
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(services);
  } catch (error) {
    console.error("Failed to fetch services:", error);

    res.status(500).json({
      message: "Failed to fetch services",
    });
  }
});

app.get("/blogs", async (req: Request, res: Response)=> {
  try {
    const blogs = await blogsCollection
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(blogs);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);

    res.status(500).json({
      message: "Failed to fetch blogs",
    });
  }
});

app.get("/services/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const service = await servicesCollection.findOne({
      slug,
      published: true,
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.json(service);
  } catch (error) {
    console.error("Failed to fetch service:", error);

    res.status(500).json({
      message: "Failed to fetch service",
    });
  }
});

app.get("/blogs/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await blogsCollection.findOne({
      slug,
      published: true,
    });

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.json(blog);
  } catch (error) {
    console.error("Failed to fetch blog:", error);

    res.status(500).json({
      message: "Failed to fetch blog",
    });
  }
});

app.post("/projects", async (req: Request, res: Response) => {
  try {
    const project = req.body;

    const newProject = {
      ...project,
      published: project.published ?? true,
      createdAt: new Date(),
    };

    const result = await projectsCollection.insertOne(newProject);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: {
        _id: result.insertedId,
        ...newProject,
      },
    });
  } catch (error) {
    console.error("Failed to create project:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
});

app.get("/admin/stats", async (req, res) => {
  try {
    const [services, projects, blogs] = await Promise.all([
      servicesCollection.countDocuments(),
      projectsCollection.countDocuments(),
      blogsCollection.countDocuments(),
    ]);

    res.json({
      services,
      projects,
      blogs,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);

    res.status(500).json({
      message: "Failed to fetch admin stats",
    });
  }
});



























    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.error);