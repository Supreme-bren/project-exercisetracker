const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String
  }
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [exerciseSchema]
})

const Session = mongoose.model('Session', exerciseSchema );
const User = mongoose.model('User', userSchema);

app.post('/api/users/', bodyParser.urlencoded({extended: false}), (req, res) =>{
  
  let newUser = new User({username: req.body.username})
  newUser.save((err, saved) =>{
    if(!err){
      res.json({
        username: saved.username,
        id: saved.id
      })
    }
  });
})

app.get('/api/users', (req, res) =>{
  User.find({}, (err, array) =>{
    if(!err){
      res.json(array)
    }
  })
})
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}), (req, res) =>{
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date,
  })
  if(newSession.date === ""){
    newSession.date = new Date().toISOString().substring(0,10)
  }
  User.findByIdAndUpdate(
    req.body[':_id'],
    {$push: {log: newSession}},
    {new: true},
    (err, upUser) =>{
      let resObject = {}
      resObject['_id'] = upUser.id;
      resObject['username'] = upUser.username;
      resObject['date'] = new Date(newSession.date).toDateString();
      resObject['description'] = newSession.description;
      resObject['duration'] = newSession.duration;
      res.json(resObject);
    }
  )
})

app.get("/api/users/:_id/logs", (req, res) =>{
  User.findById(req.params['_id'], (err, result) =>{
    let resObject = result;
    if(req.query.from || req.query.to){
      let fromDate  = new Date(0);
      let toDate = new Date();
      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }

      fromDate = fromDate.getTime();
      toDate = toDate.getTime();

      resObject.log = resObject.log.filter((sessions) =>{
        let sesDate = new Date(sessions.date).getTime();

        return sesDate >= fromDate && sesDate <= toDate;
      })
    }
    if(req.query.limit){
      resObject.log = resObject.log.slice(0, req.query.limit)
    }
    resObject['count'] = result.log.length
    res.json(resObject)
  })
})
