const express = require("express");
const cors = require("cors")
const app = express();
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");

const serviceAccount = JSON.parse(decoded);
require('dotenv').config()
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// middleware
app.use(cors({
  origin: ["https://devhire-d9081.web.app","http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
// app.use(cookieParser());

// verify token and cookies
// const verifytoken = (req, res, next) => {
//   // console.log("this is verifytoken function => ", req.cookies);
//   const token = req?.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized" })
//   }
//   jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(403).send({ message: "forbidded" })
//     }
//     req.decoded = decoded;
//     next()
//   })
// }

// firebase access token verifay
const verifyFirebaseToken = async (req, res, next) => {  
  const authHeader = req.headers.authorization;
   if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  }
  catch (error){
    return res.status(401).send({message: "unauthorized access"})
  }
  // console.log("token =>", token);
  // if (!token) {
  //   return res.status(401).send({ message: "unauthorized access" })
  // }
  // const userInfo = await admin.auth().verifyIdToken(token)
  // // console.log("inside the token => ", userInfo);
  // req.decoded = userInfo;
  // next()
}

const verifayEmailToken = (req, res, next) => {
  if(req.query.email !== req.decoded.email){
    return res.status(403).send({message: "forbidden access"});
  }
  next()
}
const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASS}@cluster0.ppjooy5.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobcollection = client.db("devhire").collection("jobs")
    const applicationcollection = client.db("devhire").collection("applications")

    // cookies related api
    // app.post("/jwt", async (req, res) => {
    //   const { email } = req.body;
    //   const token = jwt.sign({ email }, process.env.JWT_ACCESS_SECRET, {
    //     expiresIn: "1d"
    //   })
    //   // console.log("this is token => ", token);

    //   res.cookie("token", token, {
    //     httpOnly: true,
    //     // if it is not production set secure false
    //     secure: false
    //   })
    //   res.send({ seccess: true })
    // })

    // api for jobs
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      // console.log("inside application cookies => ", req.cookies);
      // if(email !== req.decoded.email) {
      //   return res.status(403),send({message: "forbieedn access"})
      // }
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const jobs = await jobcollection.find(query).toArray();
      const jobsWithApplicationCount = await Promise.all(
        jobs.map(async (job) => {
          const count = await applicationcollection.countDocuments({
            jobId: job._id.toString()
          });
          return {
            ...job,
            applicationCount: count
          }
        })
      )
      res.send(jobsWithApplicationCount)
    })

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobcollection.findOne(query);
      res.send(result)
    })

    app.get("/applications/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { jobId: id };
      const result = await applicationcollection.find(query).toArray();
      res.send(result)
    })

    // coude be done but should not be done.
    // app.get("jobsbyemail", async (req, res) => {
    //   const email = req.query.email;
    //   const query = {hr_email: email};
    //   const result = await jobcollection.find(query).toArray();
    //   res.send(result)
    // })

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobcollection.insertOne(newJob);
      res.send(result);
    })

    // api for applications
    app.get("/applications", verifyFirebaseToken,verifayEmailToken, async (req, res) => {
      const email = req.query.email;
      // console.log("req header => ", req.headers);
      // if(email !== req.decoded.email){
      //   return res.status(403).semd({ message: "forbidden access" })
      // }
      // if (email !== req.decoded.email) {
      //   return res.status(422).send({ message: "validation error" })
      // }
      const query = {
        applicant: email
      }
      const result = await applicationcollection.find(query).toArray();
      // bad way to aggregate data
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobcollection.findOne(jobQuery);
        application.company = job.company;
        application.title = job.title;
        application.company_logo = job.company_logo;
      }
      res.send(result);
    })
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationcollection.insertOne(application);
      res.send(result);
    })

    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: update
        }
      }
      const result = await applicationcollection.updateOne(filter, updateDoc);
      res.send(result)

    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("devhire is cooking!💥")
});

app.listen(port, () => {
  console.log("server running port on ", port);
  // const val = require("crypto").randomBytes(64).toString("hex");
  // console.log("bytes => ", val);
})

