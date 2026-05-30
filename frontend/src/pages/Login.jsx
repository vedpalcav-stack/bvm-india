import { useState } from "react";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      setUser(true);
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="p-10">
      <h2>Login</h2>

      <input onChange={e => setUsername(e.target.value)} placeholder="User"/>
      <br/><br/>

      <input type="password" onChange={e => setPassword(e.target.value)} placeholder="Pass"/>
      <br/><br/>

      <button onClick={login}>Login</button>
    </div>
  );
};

export default Login;