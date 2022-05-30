const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//connect w mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnjhc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//jwt verifier
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("elec-trick").collection("products");
    const userCollection = client.db("elec-trick").collection("users");
    const orderCollection = client.db("elec-trick").collection("orders");
    const reviewCollection = client.db("elec-trick").collection("reviews");

    //verify admin or not 
    const verifyAdmin =  async (req,res,next) => {
      const requester = req.decoded?.email;
      const requesterAccount = await userCollection.findOne({email: requester});
      if(requesterAccount?.role === 'admin'){
          next()
      }
      else{
          return res.status(403).send({message: 'Forbidden Aceess'});
      }

  }

    //get all services
    app.get("/product", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    //update user for JWT
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "6d",
        }
      );
      res.send({ result, token });
    });

    //get all user
    app.get('/user', verifyJWT,  async(req,res) => {
      const user = await userCollection.find().toArray();
      res.send(user);
  })

  //checking admin or not
  app.get('/admin/:email',async(req,res) => {
    const email = req.params.email;
    const user = await userCollection.findOne({email: email});
    const isAdmin = user.role === 'admin';
    res.send({admin: isAdmin});
})

  //make an admin 
  app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const updateDoc = {
     $set: {role: 'admin'},
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);

})

    //load a single product
    app.get("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    });

    //insert order details
    app.post("/order", verifyJWT, async (req, res) => {
      const orderDetail = req.body;
      const result = await orderCollection.insertOne(orderDetail);
      res.send(result);
    });

    //insert review
    app.post("/review", async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });

    //get all review
    app.get('/review', async(req,res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })

    //get individual order
    app.get("/order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email };
        const result = await orderCollection.find(query).toArray();
        res.send(result);
      }
      else{
          return res.status(403).send({message: 'Forbidden Access'});
      }
    });

    //delete order
    app.delete('/order/:id',verifyJWT, async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })

    //get all order
    app.get('/orders',verifyJWT, verifyAdmin, async(req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    })

    //delete order by admin
    app.delete('/purchase/:id', verifyJWT, verifyAdmin, async(req,res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })

    //insert product
    app.post('/product', verifyJWT, verifyAdmin, async(req,res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
  })
  //delete product
  app.delete('/product/:id', verifyJWT, verifyAdmin, async(req,res) => {
    const id = req.params.id;
    const query = {_id: ObjectId(id)};
    const result = await productCollection.deleteOne(query);
    res.send(result);
  })
  
  } 
  finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Home");
});

app.listen(port, () => {
  console.log("Listening", port);
});
