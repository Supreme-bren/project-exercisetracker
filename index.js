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
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date
})

const userSchema = new mongoose.Schema({
  username: String
})

const Session = mongoose.model('Session', exerciseSchema );
const User = mongoose.model('User', userSchema);

app.post('/api/users/', bodyParser.urlencoded({extended: false}), async (req, res) =>{
  const userObject = new User({
    username: req.body.username
  })
  try{
    const user = await userObject.save()
    res.json(user);
  }catch(error){
    console.log(error)
  }
  
})

app.get('/api/users', async (req, res) =>{
  
  const users = await User.find({}).select("_id username");
  if(!users){
    res.send("No users");
    console.log("No users")
  }
  else{
    res.json(users);
  }
})
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}), async (req, res) =>{
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date  = req.body.date;

  try{
    const user = await User.findById(id);
    if(!user){
      res.send('Could not find user');
      console.log('Could not find user')
    }
    else{
      const sessionObject = new Session({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date() : new Date()
      })
      const session = await sessionObject.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: session.description,
        duration: session.duration,
        date: new Date(session.date).toDateString()
      })
    }
  } catch(error){
    console.error(error)
  }
})

app.get("/api/users/:_id/logs", async(req, res) =>{
  
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit
  const id = req.params._id;

  const user = await User.findById(id);

  if(!user){
    res.send("couldnt find user")
    console.log("couldnt find user");
    return;
  }
  let resObject = {};

  if(from){
    resObject['$gte'] = new Date(from);
  }
  if(to){
    resObject['$lte'] = new Date(to);
  }

  let filteringObject = {
    user_id: id,
  }
  if(from || to){
    filteringObject.date = resObject
  }

  const sessions = await Session.find(filteringObject).limit(+limit ?? 500);

  const log = sessions.map(d => ({
    description: d.description,
    duration: d.duration,
    date: d.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: sessions.length,
    _id: user._id,
    log
  })
})
