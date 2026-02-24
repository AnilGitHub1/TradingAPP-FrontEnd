import React, { useState } from "react";
import ButtonDark from "../Components/Common/ButtonDark";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

export default function Login(props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const handleOnCLickLogInButton = async () => {
    try {
      if (!name.trim()) {
        return alert("Please enter your name!");
      }

      if (!email.trim()) {
        return alert("Please enter your email address!");
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/; // Gmail only
      if (!emailRegex.test(email)) {
        return alert("Please enter a valid Gmail address!");
      }

      if (!password) {
        return alert("Please enter a password!");
      }

      await login({
        email,
        password,
      });
      navigate("/");
    } catch (err) {
      console.log(err);
      alert(err.message || "Login failed");
    }
  };

  return (
    <>
      <div className="login">
        <div className="loginSection">
          <div className="loginContainer">
            <div className="loginImgContainer">
              <img loading="lazy" src="./Images/8.jpg" className="loginImg" />
            </div>
            <div className="loginFormContainer">
              <div className="loginForm">
                <div className="loginFormHeading">LOG IN</div>
                <div className="loginFormSubHeadding">
                  Sign in to access your account
                </div>
                <div className="loginFormText">Name</div>
                <input
                  className="loginFormInput"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></input>
                <div className="loginFormText">Email</div>
                <input
                  className="loginFormInput"
                  placeholder="yourmail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></input>
                <div className="loginFormText">Password</div>
                <input
                  className="loginFormInput"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                ></input>
                <div style={{ marginTop: "20px" }}>
                  <div onClick={handleOnCLickLogInButton}>
                    <ButtonDark text="log in" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
