import { useEffect, useState } from 'react';
import './App.css'
import io from "socket.io-client";
import { baseUrl, getRequest, postHeaderRequest, postRequest } from './utils/services';

const socket = io(baseUrl);

interface Message {
  username: string;
  msg: string;
}
interface User {
  user:string
}
const defaultSession = 'defaultSession'

function App() {
 
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [message,setMessage] = useState('')
  const [loginFlag, setLoginFlag] =  useState(false)
  const [registerFlag, setRegisterFlag] =  useState(false)
  const [messageError, setMessageError] = useState('')
  const [arrMsg, setArrMsg] = useState<Message[]>([])
  const [sessionUsers, setSessionUsers] = useState<User[]>([])
    
  useEffect(() => {
    socket.on("chat message", (msg, username) => {
      setArrMsg([...arrMsg, {username, msg}])
    })

    socket.on('newUser', (newUser) => {
      setSessionUsers(newUser)
      console.info('en neww user on:  ', sessionUsers, newUser)
    })

    socket.on('currentUsers', (users) => {
      setSessionUsers(users)
      console.info('en currentUsers on: ',sessionUsers, users);

    })
   
    return () => {
      socket.off("chat message");
      socket.off('newUser');
      socket.off('currentUsers');
    }
  }, [arrMsg, sessionUsers])
  const handleLoginUser = async(e:React.FormEvent) => {
    e.preventDefault()
    const userName = user
    const userPassword = password
    await postRequest(
      `${baseUrl}/login`,
      JSON.stringify({userName,userPassword})
      )
      .then((response) => {
        if (response.error) {
         setMessageError('Invalid user name or password')
         setTimeout(() => {
          setMessageError('')
         }, 2000)
        }
        return response
      })
      .then((data) => {
        if(data.user.userName) {
          setLoginFlag(true)
          socket.emit('addUser', user, defaultSession)
          console.log('aqiii handleLogin',data.user.userName)
          localStorage.setItem("User", JSON.stringify(data.user))
          setLoginFlag(true)
          setRegisterFlag(true)
          previousMessages()
        }
      })
    }
  
  
    const previousMessages = async () => { 
      let userInfo = localStorage.getItem('User')

      const oldMsg = await getRequest(
        `${baseUrl}/chat/${defaultSession}`,
        userInfo)
          
      if (!oldMsg.ok) {
        setMessageError('Empty previous messages')
        setTimeout(() => {
          setMessageError('')
        }, 2000)
      } else {
        console.log(oldMsg)
        setArrMsg([oldMsg])
      }
    }
  const handleSubmitMessage = async(e:React.FormEvent) => {
    e.preventDefault()
    let userInfo = localStorage.getItem('User')
    
    console.info('en el handleMessage', sessionUsers, userInfo);
    const messageInfo = {
      chatId: 'defaultRoom', 
      users: [user], 
      senderId: socket.id, 
      text: message,
    };
    await postHeaderRequest(
      `${baseUrl}/chat`,
      JSON.stringify(messageInfo),
      userInfo
    ).then((response) => {
      if (!response.messageInfo) {
        setMessageError('Invalid user name o password')
        setTimeout(() => {
          setMessageError('')
        }, 2000)
      }
      return response
    })
    .then((data) => { 
      if (data) {
        setRegisterFlag(true)
        setLoginFlag(true)
      }
    })
    socket.emit('chat message', message, user)
    setMessage('')
  }

  const handleRegisterUser = async (e:React.FormEvent) => {
    e.preventDefault()
    const userName = user
    const userPassword = password
    await postRequest(
      `${baseUrl}/register`,
      JSON.stringify({userName,userPassword})
    ).then((response) => {
      if (response.error) {
        setMessageError('Invalid user name o password')
        setTimeout(() => {
          setMessageError('')
        }, 2000)
      }
      return response
    })
    .then((data) => { 
      if (data.user.userName) {
        socket.emit('addUser', user, defaultSession)
        localStorage.setItem("User", JSON.stringify(data.user))
        setRegisterFlag(true)
        setLoginFlag(true)
        previousMessages()
      }
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("User")
    socket.emit('deletedUser', user)
    setLoginFlag(false)
    setRegisterFlag(false)
    setUser('')
  }
  return (
    <>
      {(!loginFlag && !registerFlag) &&
      <>
        <form onSubmit={handleLoginUser}>
          <h2 >Login</h2>
          <p style={{color: "red"}}>{messageError}</p>

          <input type="text" placeholder='user name' autoFocus onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder='user password' onChange={e => setPassword(e.target.value)} />
          <button type="submit">login</button>        
        </form>
        <p>if you don't have account <a onClick={
          () => {
             setRegisterFlag(true)
             }}>register</a> please</p>
      </> 
      }
      {registerFlag && !loginFlag &&
        <>

        <form onSubmit={handleRegisterUser}>
          <h2>Register</h2>
        <p style={{color: "red"}}>{messageError}</p>
          <input type="text" placeholder='user name' autoFocus onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder='user password'  onChange={e => setPassword(e.target.value)} />
          <button type="submit">Register</button>        
        </form>
        </>
        }
      {(loginFlag && registerFlag) && <>
      <div style={{textAlign: "left"}}>
        <h3>Users</h3>
        <ul>
          {sessionUsers.map((value, index) => (
            <li style={{listStyle: "none"}} key={index}>{value}</li>
          ))}
        </ul>
      </div>
      <div style={{textAlign: "right", listStyle: "none"}}>
            <h2>Chat</h2>
        <ul>
        {arrMsg.map((value, index) => (
         value.username == user 
            ?<li style={{listStyle: "none", color:"brown", textAlign:"center"}}  key={index}>{value.username} : { value.msg}</li>
            :<li style={{listStyle: "none"}}  key={index}>{value.username} : { value.msg}</li>
        ))}
        </ul>
      </div>
      <form onSubmit={handleSubmitMessage}>
        <input type="text" placeholder='write message' value={message} size={50} autoFocus onChange={e => setMessage(e.target.value)}/>
        
      </form>
      <button onClick={handleLogout}>LogOut</button>
       </>}
    </>
  )
}

export default App
