const express = require("express");
const app = express();
var http = require("http").createServer(app);
const port = process.env.PORT || 3000;
var io = require("socket.io")(http);
const path = require("path");
const mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mousedata",
});

app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/output", (req, res) => {
  res.sendFile(__dirname + "/output.html");
});

app.post("/savedata", (req, res, next) => {
  const mouse_data = {
    ip: "192.168.1.1",
    data: JSON.stringify(req.body.frames),
    end_time: req.body.endtime,
    start_time: req.body.starttime,
  };
  connection.query(
    "INSERT INTO position_records SET ?",
    mouse_data,
    (err, docs) => {
      if (err) throw err;

      res.send("Last insert ID: " + docs.insertId);
    }
  );
});

app.get("/getdata", (req, res) => {
  connection.query(
    "SELECT data,start_time,end_time FROM position_records order by created desc limit 1 ",
    (err, row) => {
      if (err) throw err;

      console.log("Data received from Db:");
      console.log(row[0].data);
      const full_data = {};
      full_data.newdata = JSON.parse(row[0].data);
      full_data.start_time = row[0].start_time;
      full_data.end_time = row[0].end_time;
      res.send(full_data);
    }
  );
});

io.on("connection", (socket) => {
  socket.on("mouse_position", (msg) => {
    socket.broadcast.emit("mouse_position", msg);
    socket.disconnected;
  });
});

http.listen(port, () => {
  console.log("listening on *:3000 or " + port);
});
