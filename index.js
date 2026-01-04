const express = require("express");
const cors = require("cors")
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
// middleware
app.use(cors());
app.use(express.json());



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
    // api for jobs
    app.get("/jobs", async(req, res) => {
      const email = req.query.email;
      const query = {};
      if(email){
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

    app.get("/jobs/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobcollection.findOne(query);
      res.send(result)
    })

    app.get("/applications/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = {jobId: id};
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

    app.post("/jobs",async (req, res) => {
      const newJob = req.body;
      const result = await jobcollection.insertOne(newJob);
      res.send(result);
    })
    // api for applications
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email
      }
      const result = await applicationcollection.find(query).toArray();
      // bad way to aggregate data
      for(const application of result) {
        const jobId = application.jobId;
        const jobQuery = {_id: new ObjectId(jobId)};
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

    app.patch("/applications/:id", async(req, res) => {
      const id = req.params.id;
      const update = req.body.status;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: update
        }
      }
      const result = await applicationcollection.updateOne(filter,updateDoc);
      res.send(result)

    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
    
})