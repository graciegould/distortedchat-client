import { useState, useEffect, useRef } from "react"
import './App.css';
import { io } from "socket.io-client";
import uuid from 'react-uuid'
const connectionOptions = {
  "force new connection": true,
  "forceBase64": true,
  "reconnectionAttempts": "Infinity", //avoid having user reconnect manually in order to prevent dead clients after a server restart
  "timeout": 10000, //before connect_error and connect_timeout are emitted.
  "transports": ["websocket"]
};
let socket = io.connect("https://distortedchat-server.herokuapp.com/", connectionOptions)
function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [count, setCount] = useState(0)
  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
  })
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    socket.on("count", (data)=>{
      setCount(data)
    })
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    }

  }, [])

  useEffect(() => {
    socket.on("count", (data) => {
      setCount(data)
    })
  })
  return (
    <div className="container">
      <div className="chatContainer">
        <div className="count">connections: {" "+count+"     "} 
        <br></br>
        you are {isConnected===true?"connected":"disconnected"}</div>

        <Chat  />
      </div>
    </div>

  );
}

function Chat(props) {
  const [messages, setMessages] = useState([])
  const [images, setImages] = useState([])
  useEffect(() => {
    socket.on("recieveImage", (data)=>{
      const rw = Math.floor(Math.random()*100);
      const rh = Math.floor(Math.random()*100);
      setImages([...images, {url:data, x:rw+"%", y:rh+"%"}])
    })
    return () => {
      socket.off('recieveImage');
    }
  })

  return (
    <div className="displayChats">
      <DisplayMessages messages={messages} setMessages={setMessages} images={images}/>
      <SendMessages messages={messages} setMessages={setMessages} />
    </div>

  )
}


function DisplayMessages(props) {
  const messages = props.messages;
  const setMessages = props.setMessages;
  const images = props.images;

  useEffect(() => {
    socket.on("recieveMsg", (data) => {
      const rw = Math.floor(Math.random()*100);
      const rh = Math.floor(Math.random()*100);
      setMessages([...messages, {msg:data, x:rw+"%", y:rh+"%",r:Math.floor(Math.random()*360)}])
    })
    return () => {
      socket.off("receiveMsg")
    }
  })
  const handleOver = (e)=>{
e.target.style.transform ="rotateZ("+Math.floor(Math.random()*360)+"deg)";
  }

  return (
    <div>
      {images.map((url, index)=>{
        return(
          <div  key={uuid()}   >
          <img 
          className="sentImage"
          alt="img"
          src={url.url}
          style={{top:url.y, left:url.x, r:url.r}}
          width="20%"
          />
          </div>
        )
      })
      }
      {messages.map((msg, index) => {
        return (
          <div key={uuid()} 
          >
           <div className="msg" onMouseOver={handleOver}  style={{top:msg.y, left:msg.x, transform:"rotateZ("+ msg.r+"deg)"}}> {msg.msg}</div>
          </div>
        )
      })}
    </div>
  )
}

function SendMessages(props) {
  const setMessages = props.setMessages;
  const messages = props.messages;
  const [sendImage, setSendImage] = useState(false)
  const [msg, setMsg] = useState("")
  const handleMsg = (e) => {
    setMsg(e.target.value)
  }
  const handleSend = (e) => {
    if (msg.trim() !== "") {
      socket.emit("sendMsg", msg)
      setMsg("")
    }
  }
  return (
    <div className="chatInput">
      <textarea onChange={handleMsg} value={msg} />
      <button onClick={handleSend}>send message</button>
      <FileInput sendImage={sendImage} setSendImage={setSendImage} />
      <button onClick={() => setSendImage(true)}>Send Image</button>
    </div>
  )
}
const imageMimeType = /image\/(png|jpg|jpeg)/i;


function FileInput(props) {
  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState(null);
  useEffect(() => {
    if (props.sendImage == true && fileDataURL !== null) {
      props.setSendImage(false)
      socket.emit("sendImage", fileDataURL)
    }
  }, [props, fileDataURL])
  const handleFileInput = (e) => {

    // handle validations
    const f = e.target.files[0];

     if (!f.type.match(imageMimeType)) {
      alert("not an image");
      console.log(f.size)
      return;
     }else if (f.size >81610){
      alert("image too big :-(");

     }else{
      console.log(f.size)
      setFile(f);
    }
  }
  useEffect(() => {
    let fileReader, isCancel = false;
    if (file) {
      fileReader = new FileReader();
      fileReader.onload = (e) => {
        const { result } = e.target;
        if (result && !isCancel) {
          setFileDataURL(result)
        }
      }
      fileReader.readAsDataURL(file);
    }
    return () => {
      isCancel = true;
      if (fileReader && fileReader.readyState === 1) {
        fileReader.abort();
      }
    }

  }, [file]);

  return (
    <div id="fileInpHolder">
      <label >
        <div className="fileSelect" style={{ backgroundImage: fileDataURL === null ? null : "url(" + fileDataURL + ")", backgroundSize: "100%" }}>
          <div>load an image</div>
          <input type="file" id="file"
            onChange={handleFileInput} />
        </div>
      </label>
    </div>

  )
}
export default App;
