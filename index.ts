const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


// start point
const express = require("express");
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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
app.get("/", (req: Request, res: Response) => {
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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);


const verifyToken = async (req: AuthRequest,
  res: Response,
  next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token === "undefined" || token === "null"){
    return res.status(401).json({
    message: "Invalid authentication token",
  });
  }
  try {

    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;

    next();
  } catch (error: any) {
    console.error(error);

    return res.status(403).json({
      msg: "Unauthorized"
    });
  }
};


async function run() {
  try {

    // await client.connect();

    // mongodbcollection
    console.log("MongoDB Connected");
    const db = client.db("crafthaus_db");

    const projectsCollection = db.collection("projects");
    const servicesCollection = db.collection("services");
    const blogsCollection = db.collection("blogs");
    const contactMessagesCollection = db.collection("contact_messages");

    const seoCollection = db.collection("seo");

//seo part
    app.get("/seo", async (req: Request, res: Response) => {
  try {
    const seo = await seoCollection.findOne({});

    res.json(seo);
  } catch (error) {
    console.error("Failed to fetch public SEO settings:", error);

    res.status(500).json({
      message: "Failed to fetch SEO settings",
    });
  }
});
    app.get("/admin/seo", verifyToken, async (req: Request, res: Response) => {
  try {
    const seo = await seoCollection.findOne({});

    res.json(seo);
  } catch (error) {
    console.error("Failed to fetch SEO settings:", error);

    res.status(500).json({
      message: "Failed to fetch SEO settings",
    });
  }
});

app.patch(
  "/admin/seo",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const seoData = {
        ...req.body,
        updatedAt: new Date(),
      };

      const existingSeo = await seoCollection.findOne({});

      if (existingSeo) {
        await seoCollection.updateOne(
          { _id: existingSeo._id },
          { $set: seoData }
        );

        const updatedSeo = await seoCollection.findOne({
          _id: existingSeo._id,
        });

        return res.json(updatedSeo);
      }

      const result = await seoCollection.insertOne(seoData);

      res.status(201).json({
        _id: result.insertedId,
        ...seoData,
      });
    } catch (error) {
      console.error("Failed to save SEO settings:", error);

      res.status(500).json({
        message: "Failed to save SEO settings",
      });
    }
  }
);

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

    app.get("/blogs", async (req: Request, res: Response) => {
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

    // Admin service part start
    app.post("/admin/services", verifyToken, async (req: Request, res: Response) => {
      try {
        const service = req.body;

        const newService = {
          ...service,
          published: service.published ?? false,
          createdAt: new Date(),
        };

        const result = await servicesCollection.insertOne(newService);

        res.status(201).json({
          success: true,
          message: "Service created successfully",
          service: {
            _id: result.insertedId,
            ...newService,
          },
        });
      } catch (error) {
        console.error("Failed to create service:", error);

        res.status(500).json({
          success: false,
          message: "Failed to create service",
        });
      }
    });


    app.get("/admin/services", verifyToken, async (req: Request, res: Response) => {
      try {
        const services = await servicesCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json(services);
      } catch (error) {
        console.error("Failed to fetch admin services:", error);

        res.status(500).json({
          message: "Failed to fetch admin services",
        });
      }
    });

    app.patch("/admin/services/:id", verifyToken, async (req: Request, res: Response) => {
      try {

        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid service ID",
          });
        }

        const updates = {
          ...req.body,
          updatedAt: new Date(),
        };

        delete updates._id;

        const result = await servicesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            message: "Service not found",
          });
        }

        const updatedService = await servicesCollection.findOne({
          _id: new ObjectId(id),
        });

        res.json({
          success: true,
          message: "Service updated successfully",
          service: updatedService,
        });
      } catch (error) {
        console.error("Failed to update service:", error);

        res.status(500).json({
          success: false,
          message: "Failed to update service",
        });
      }
    });




    app.delete("/admin/services/:id", verifyToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).json({
            message: "Service ID is required",
          });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid service ID",
          });
        }

        const result = await servicesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            message: "Service not found",
          });
        }

        res.json({
          success: true,
          message: "Service deleted successfully",
        });
      } catch (error) {
        console.error("Failed to delete service:", error);

        res.status(500).json({
          success: false,
          message: "Failed to delete service",
        });
      }
    });


    app.patch(
      "/admin/services/:id/publish", verifyToken,
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Service ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid service ID",
            });
          }

          const service = await servicesCollection.findOne({
            _id: new ObjectId(id),
          });

          if (!service) {
            return res.status(404).json({
              message: "Service not found",
            });
          }

          const newPublishedStatus = !service.published;

          await servicesCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                published: newPublishedStatus,
                updatedAt: new Date(),
              },
            }
          );

          res.json({
            success: true,
            message: newPublishedStatus
              ? "Service published successfully"
              : "Service unpublished successfully",
            published: newPublishedStatus,
          });
        } catch (error) {
          console.error("Failed to change service publish status:", error);

          res.status(500).json({
            success: false,
            message: "Failed to change service publish status",
          });
        }
      }
    );



    app.get("/admin/stats", verifyToken, async (req: Request, res: Response) => {
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

    app.delete("/admin/services/:id", verifyToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).json({
            message: "Service ID is required",
          });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid service ID",
          });
        }

        const result = await servicesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            message: "Service not found",
          });
        }

        res.json({
          success: true,
          message: "Service deleted successfully",
        });
      } catch (error) {
        console.error("Failed to delete service:", error);

        res.status(500).json({
          success: false,
          message: "Failed to delete service",
        });
      }
    });

    // app.delete("/admin/services/:id", async (req: Request, res: Response) => {
    //   try {
    //     const { id } = req.params;

    //     if (!id) {
    //       return res.status(400).json({
    //         message: "Service ID is required",
    //       });
    //     }

    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).json({
    //         message: "Invalid service ID",
    //       });
    //     }

    //     const result = await servicesCollection.deleteOne({
    //       _id: new ObjectId(id),
    //     });

    //     if (result.deletedCount === 0) {
    //       return res.status(404).json({
    //         message: "Service not found",
    //       });
    //     }

    //     res.json({
    //       success: true,
    //       message: "Service deleted successfully",
    //     });
    //   } catch (error) {
    //     console.error("Failed to delete service:", error);

    //     res.status(500).json({
    //       success: false,
    //       message: "Failed to delete service",
    //     });
    //   }
    // });


    // Admin service part end



    //Admin project part start

    app.get("/admin/projects", async (req: Request, res: Response) => {
      try {
        const projects = await projectsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json(projects);
      } catch (error) {
        console.error("Failed to fetch admin projects:", error);

        res.status(500).json({
          message: "Failed to fetch admin projects",
        });
      }
    });
    app.patch(
      "/admin/projects/:id/publish",
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Project ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid project ID",
            });
          }

          const project = await projectsCollection.findOne({
            _id: new ObjectId(id),
          });

          if (!project) {
            return res.status(404).json({
              message: "Project not found",
            });
          }

          const newPublishedStatus = !project.published;

          await projectsCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: {
                published: newPublishedStatus,
                updatedAt: new Date(),
              },
            }
          );

          res.json({
            success: true,
            message: newPublishedStatus
              ? "Project published successfully"
              : "Project unpublished successfully",
            published: newPublishedStatus,
          });
        } catch (error) {
          console.error(
            "Failed to change project publish status:",
            error
          );

          res.status(500).json({
            message: "Failed to change project publish status",
          });
        }
      }
    );
    app.patch("/admin/projects/:id", async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).json({
            message: "Project ID is required",
          });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid project ID",
          });
        }

        const updates = {
          ...req.body,
          updatedAt: new Date(),
        };

        delete updates._id;

        const result = await projectsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: updates,
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            message: "Project not found",
          });
        }

        const updatedProject = await projectsCollection.findOne({
          _id: new ObjectId(id),
        });

        res.json({
          success: true,
          message: "Project updated successfully",
          project: updatedProject,
        });
      } catch (error) {
        console.error("Failed to update project:", error);

        res.status(500).json({
          message: "Failed to update project",
        });
      }
    });
    app.delete(
      "/admin/projects/:id",
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Project ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid project ID",
            });
          }

          const result = await projectsCollection.deleteOne({
            _id: new ObjectId(id),
          });

          if (result.deletedCount === 0) {
            return res.status(404).json({
              message: "Project not found",
            });
          }

          res.json({
            success: true,
            message: "Project deleted successfully",
          });
        } catch (error) {
          console.error("Failed to delete project:", error);

          res.status(500).json({
            message: "Failed to delete project",
          });
        }
      }
    );

    app.get(
      "/projects/:slug",
      async (req: Request, res: Response) => {
        try {
          const { slug } = req.params;

          if (!slug) {
            return res.status(400).json({
              message: "Project slug is required",
            });
          }

          const project = await projectsCollection.findOne({
            slug,
            published: true,
          });

          if (!project) {
            return res.status(404).json({
              message: "Project not found",
            });
          }

          res.json(project);
        } catch (error) {
          console.error(
            "Failed to fetch project:",
            error
          );

          res.status(500).json({
            message: "Failed to fetch project",
          });
        }
      }
    );
    //Admin project part end

    //Admin blogs parts start

    app.get("/admin/blogs", async (req: Request, res: Response) => {
      try {
        const blogs = await blogsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json(blogs);
      } catch (error) {
        console.error("Failed to fetch admin blogs:", error);

        res.status(500).json({
          message: "Failed to fetch admin blogs",
        });
      }
    });

    app.post(
      "/admin/blogs",
      async (req: Request, res: Response) => {
        try {
          const blog = req.body;

          const newBlog = {
            ...blog,
            published: blog.published ?? false,
            createdAt: new Date(),
          };

          const result =
            await blogsCollection.insertOne(newBlog);

          res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: {
              _id: result.insertedId,
              ...newBlog,
            },
          });
        } catch (error) {
          console.error(
            "Failed to create blog:",
            error
          );

          res.status(500).json({
            message: "Failed to create blog",
          });
        }
      }
    );
    app.patch(
      "/admin/blogs/:id",
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Blog ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid blog ID",
            });
          }

          const updates = {
            ...req.body,
            updatedAt: new Date(),
          };

          delete updates._id;

          const result = await blogsCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: updates,
            }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({
              message: "Blog not found",
            });
          }

          const updatedBlog =
            await blogsCollection.findOne({
              _id: new ObjectId(id),
            });

          res.json({
            success: true,
            message: "Blog updated successfully",
            blog: updatedBlog,
          });
        } catch (error) {
          console.error(
            "Failed to update blog:",
            error
          );

          res.status(500).json({
            message: "Failed to update blog",
          });
        }
      }
    );

    app.patch(
      "/admin/blogs/:id/publish",
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Blog ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid blog ID",
            });
          }

          const blog = await blogsCollection.findOne({
            _id: new ObjectId(id),
          });

          if (!blog) {
            return res.status(404).json({
              message: "Blog not found",
            });
          }

          const newPublishedStatus = !blog.published;

          await blogsCollection.updateOne(
            {
              _id: new ObjectId(id),
            },
            {
              $set: {
                published: newPublishedStatus,
                updatedAt: new Date(),
              },
            }
          );

          res.json({
            success: true,
            message: newPublishedStatus
              ? "Blog published successfully"
              : "Blog unpublished successfully",
            published: newPublishedStatus,
          });
        } catch (error) {
          console.error(
            "Failed to change blog publish status:",
            error
          );

          res.status(500).json({
            message:
              "Failed to change blog publish status",
          });
        }
      }
    );
    app.delete(
      "/admin/blogs/:id",
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({
              message: "Blog ID is required",
            });
          }

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({
              message: "Invalid blog ID",
            });
          }

          const result = await blogsCollection.deleteOne({
            _id: new ObjectId(id),
          });

          if (result.deletedCount === 0) {
            return res.status(404).json({
              message: "Blog not found",
            });
          }

          res.json({
            success: true,
            message: "Blog deleted successfully",
          });
        } catch (error) {
          console.error(
            "Failed to delete blog:",
            error
          );

          res.status(500).json({
            message: "Failed to delete blog",
          });
        }
      }
    );

    app.post(
      "/contact",
      async (req: Request, res: Response) => {
        try {
          const { name, email, phone, message } =
            req.body;

          if (!name || !email || !message) {
            return res.status(400).json({
              message:
                "Name, email and message are required",
            });
          }

          const newMessage = {
            name,
            email,
            phone: phone || "",
            message,
            read: false,
            createdAt: new Date(),
          };

          const result =
            await contactMessagesCollection.insertOne(
              newMessage
            );

          res.status(201).json({
            success: true,
            message:
              "Contact message sent successfully",
            contactMessage: {
              _id: result.insertedId,
              ...newMessage,
            },
          });
        } catch (error) {
          console.error(
            "Failed to save contact message:",
            error
          );

          res.status(500).json({
            message:
              "Failed to save contact message",
          });
        }
      }
    );
    //Admin blogs part end
    //Admin message part start
    app.get("/admin/messages", async (req: Request, res: Response) => {
      try {
        const messages = await contactMessagesCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json(messages);
      } catch (error) {
        console.error("Failed to fetch contact messages:", error);

        res.status(500).json({
          message: "Failed to fetch contact messages",
        });
      }
    });

    app.patch("/admin/messages/:id/read", async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid message ID",
          });
        }

        const message = await contactMessagesCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!message) {
          return res.status(404).json({
            message: "Message not found",
          });
        }

        const newReadStatus = !message.read;

        await contactMessagesCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              read: newReadStatus,
            },
          }
        );

        res.json({
          success: true,
          read: newReadStatus,
        });
      } catch (error) {
        console.error("Failed to change message read status:", error);

        res.status(500).json({
          message: "Failed to change message read status",
        });
      }
    });

    app.delete("/admin/messages/:id", async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            message: "Invalid message ID",
          });
        }

        const result = await contactMessagesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            message: "Message not found",
          });
        }

        res.json({
          success: true,
          message: "Message deleted successfully",
        });
      } catch (error) {
        console.error("Failed to delete message:", error);

        res.status(500).json({
          message: "Failed to delete message",
        });
      }
    });
    //admin message part end
















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