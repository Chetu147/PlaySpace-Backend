const expresss = require('express');
const app = expresss();

const cors = require('cors');

app.use(cors());
app.use(expresss.json());

const fs = require('fs');
const path = require('path');

// mongodb connection

const {MongoClient} = require('mongodb');

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

// Connect to MongoDB before starting the server
async function startServer() {

  await client.connect();

  //data base connection
  const db = client.db('PlaySpace');

  //logger
  app.use(function(request, response, next) {

    console.log(request.method + " to " + request.url);

    next();

  });

  // static files

  app.use('/images', function(req, res, next) {

    const filePath = path.join(__dirname, 'images', req.path);

    fs.stat(filePath, function(err, fileInfo) {

      // If image is missing, show an error
      if (err || !fileInfo.isFile()) {
        return res.status(404).send('Image not found');
      }

      res.sendFile(filePath);

    });

  });

  // SEARCH FUNCTIONAILTY 

  app.get('/search', async function(req, res) {
  try {
    const search = String(req.query.search || '').toLowerCase();

    const collection = db.collection('lesson');
    const lessons = await collection.find({}).toArray();

    const matchingLessons = lessons.filter(function(lesson) {
      return lesson.title.toLowerCase().includes(search) ||
             lesson.location.toLowerCase().includes(search) ||
             lesson.price.toString().includes(search) ||
             lesson.availableSlots.toString().includes(search);
    });

    res.json(matchingLessons);

  } catch (error) {
    res.status(500).send('Error searching lessons');
  }
});

  // GET ROUTE

  app.get('/lessons', async function(req, res) {
    try {
      const collection = db.collection('lesson');
      const lessons = await collection.find({}).toArray();
      res.json(lessons);
    } catch (error) {
      res.status(500).send('Error retrieving lessons');
    }
  });

  // GET TEACHERS

    app.get('/teachers', async function(req, res) {
      try {
        const collection = db.collection('teacher');
        const teachers = await collection.find({}).toArray();
        res.json(teachers);
      } catch (error) {
        res.status(500).send('Error retrieving teachers');
      }
    });

    // ENROLMENT CHALLENGE

        app.get('/enrolment/:lessonid', async function(req, res) {
          try {

            const lessonid = Number(req.params.lessonid);

            const collection = db.collection('order');
            const orders = await collection.find({}).toArray();

            let total = 0;

            for (const order of orders) {
              for (const id of order.lessonIDs) {
                if (id === lessonid) {
                  total++;
                }
              }
            }

            res.json({ enrolment: total });

          } catch (error) {
            res.status(500).send('Error retrieving enrolment');
          }
        });
              
  // POST ROUTE

  app.post('/orders', async function(req, res, next) {
    try {

      const collection = db.collection('order');
      const result = await collection.insertOne(req.body);
      res.json(result);

    } catch (err) {
      next(err);
    }
  });

  // PUT ROUTE

  app.put('/lessons/:id', async function(req, res, next) {
    try {

      const collection = db.collection('lesson');
      const result = await collection.updateOne(
        { id: Number(req.params.id) },
        { $set: req.body }
      );

      res.json(result);

    } catch (err) {
      next(err);
    }
  });

  // server port

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, function() {
        console.log('Server is running on port ' + PORT);
  });

}

startServer().catch(function(error) {
  console.log('MongoDB connection error:', error.message);
});
