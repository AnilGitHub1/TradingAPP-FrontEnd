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
      <div class="login">
        <div class="loginSection">
          <div class="loginContainer">
            <div class="loginImgContainer">
              <img loading="lazy" src="./Images/8.jpg" class="loginImg" />
            </div>
            <div class="loginFormContainer">
              <div class="loginForm">
                <div class="loginFormHeading">LOG IN</div>
                <div class="loginFormSubHeadding">
                  Sign in to access your account
                </div>
                <div class="loginFormText">Name</div>
                <input
                  class="loginFormInput"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></input>
                <div class="loginFormText">Email</div>
                <input
                  class="loginFormInput"
                  placeholder="yourmail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></input>
                <div class="loginFormText">Password</div>
                <input
                  class="loginFormInput"
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
