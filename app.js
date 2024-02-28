const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mongoose = require('mongoose');
const cors = require('cors')
app.use(cors());

const http = require('http')
const socketIo = require('socket.io')
const server = http.Server(app)
const io = socketIo(server);
require("dotenv").config();

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobileNo: { type: String, required: true, validate: /^\d{10}$/ },
  email: {
    type: String,
    required: true,
    validate: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    unique: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  loginId: {
    type: String,
    required: true,
    validate: /^[a-zA-Z0-9]{8,}$/,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    validate:
      /(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{6,}/,
  },
  creationTime: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);


app.get('/users', (req, res) => {
  res.sendFile(__dirname + '/data.html')
})
app.use('/', express.static(__dirname + "/public"))

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/registration.html");
})



app.post("/api/validate", async (req, res) => {
    const userData = req.body;

  const { firstName, lastName, mobileNo, email, address, loginId, password } =
    userData;
  const errors = {};

  try {
    // Server-side validation
    if (!firstName) {
      errors.firstName = "Please enter a First Name.";
    }

    if (!lastName) {
      errors.lastName = "Please enter a Last Name.";
    }

    if (!mobileNo || !/^\d{10}$/.test(mobileNo)) {
      errors.mobileNo = "Please enter a valid 10-digit Mobile No.";
    }

    if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    } else {
      // Check for uniqueness in the database
      const existingEmailData = await User.findOne({ email });
      if (existingEmailData) {
        errors.email = "Email already exists.";
      }
    }

    if (!address || !address.street) {
      errors.street = "Please enter a Street.";
    }

    if (!address || !address.city) {
      errors.city = "Please enter a City.";
    }

    if (!address || !address.state) {
      errors.state = "Please enter a State.";
    }

    if (!address || !address.country) {
      errors.country = "Please enter a Country.";
    }

    if (!loginId || !/^[a-zA-Z0-9]{8}$/.test(loginId)) {
      errors.loginId =
        "Please enter a valid Login ID (8 characters alphanumeric).";
    } else {
      // Check for uniqueness in the database
      const existingLoginIdData = await User.findOne({ loginId });
      if (existingLoginIdData) {
        errors.loginId = "Login ID already exists.";
      }
    }

    if (
      !password ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{6,}/.test(
        password
      )
    ) {
      errors.password =
        "Please enter a valid password (6 characters, 1 upper case letter, 1 lower case letter, 1 special character).";
    }

    if (Object.keys(errors).length === 0) {
      // If no validation errors, send success response
      res.json({ success: true });
    } else {
      // If validation errors, send errors to the client
      res.json({ success: false, errors });
    }
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred." });
  }
});


const userDetails = {}

app.post('/', (req, res) => {

  const userData = req.body;
  // console.log(userData)
  User.create(userData).then(() => {
    io.on('connection', socket => {
      console.log('A user connected:', socket.id);

      socket.join('live users');

      userDetails[socket.id] = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        socketId: socket.id,
      };
      console.log(userDetails)
      // Emit event to update list of connected users
      io.to('live users').emit('UserList', Object.values(userDetails));

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

      });
    });
    console.log("Successfully Inserted!");
    res.json({ success: true, message: "Data saved successfully" });
  }).catch((err) => {
    console.error('Error inserting user:', err);
    res.status(500).send('Internal server error.');
  })
})

app.post('/api/users', (req, res) => {
  const email = req.body.email;

  User.find({ email })
    .then((data) => {
      res.json(data)
      //console.log(user)
    }).catch((err) => {
      console.error('Error to find data:', err);
      res.status(500).send('error to find data.');
    })
})

function isValidEmail(email) {
  // Basic email format validation using a regular expression
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

