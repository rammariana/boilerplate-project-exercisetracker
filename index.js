const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

const mySecret = process.env['MONGO_URI']

mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
});

app.use(cors())
app.use(express.static('public'))
//app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const opcionesFecha = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };

const Schema = mongoose.Schema;
const personSchema = new Schema({
  "username": {type: String, require: true},
})
// https://boilerplate-project-exercisetracker.marianasmatos1.repl.co/api/users/6567be31c683155f1a907c47/exercises
const exerciseSchema = new Schema({
  "userId": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  "username": { type: String, ref: 'User' },
  "date": {type: Date},
  "duration": {type: Number, require: true},
  "description": {type: String, require: true},
})
const Person = mongoose.model('Person', personSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.get('/api/users', async (req, res) => {
  try {
    const users = await Person.find({}, 'username _id', { sort: { _id: -1 } });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  console.log('Datos recibidos:', req.body);

    try {
      const person = new Person({ username: username });
      const data = await person.save();
      res.json({ "username": data.username, "_id": data.id });
      console.log( 'usuario', username);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.get('/api/users/:_id/exercises', async (req, res) => {
  const excercise = await Exercise.findOne(
    { userId: req.params._id })
  const formaterDate = excercise.date.toLocaleDateString('en-US', opcionesFecha);
  console.log(formaterDate)
  
  try {
    res.json({
      "_id": excercise.userId,
      "username": excercise.username,
      "date": formaterDate,
      "duration": excercise.duration,
      "description": excercise.description
    
    });
  
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date(); 

   const userData = await Person.findOne({ _id: userId }).select('username');
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  const username = userData.username;
  console.log("port", username);
  
  try {
    const exercise = new Exercise({ userId, description,  duration, date, username});
    data = await exercise.save();
    res.json({
      "_id": data.userId,
      "username": data.username,
      "date": data.date.toDateString(),
      "duration": data.duration,
      "description": data.description
    });
    console.log('post', data);
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: 'Not Found' });
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {  
  //const exerciseData = await Exercise.findOne({ userId: req.params._id });

  let query = { userId: req.params._id };

  // Verificar y agregar el filtro de fecha (from y to)
  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) {
      query.date.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      query.date.$lte = new Date(req.query.to);
    }
  }

  // Obtener el recuento de ejercicios
  const exerciseCount = await Exercise.countDocuments(query);

  // Agregar el límite (limit)
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;

  // Obtener los ejercicios
  const exerciseData = await Exercise.find(query).limit(limit);

  // Mapear los ejercicios
  const exerciseLog = exerciseData.map((exercise) => ({
    description: exercise.description.toString(),
    duration: Number(exercise.duration),
    date: exercise.date.toDateString(),
  }));
  ///api/users/6568b46e06f2b39abdb8486e/logs?from=2023-01-01&to=2023-12-31&limit=10

  try{
  const userData = await Person.findOne({ _id: req.params._id }).select('username');

    res.json({
        _id: userData.id,
        username: userData.username,
        count: exerciseLog.length,
        log: exerciseLog
    });
  } catch (err) {
    console.log(err)
  }

}) 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

/*
///api/users/6568b46e06f2b39abdb8486e/exercises

*/
