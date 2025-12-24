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
      const cursor = jobcollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get("/jobs/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobcollection.findOne(query);
      res.send(result)
    })
    // job application apis
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationcollection.insertOne(application);
      res.send(result);
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