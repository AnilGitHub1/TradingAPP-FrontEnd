import React, { useState } from "react";
import ButtonDark from "../Components/Common/ButtonDark";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register } = useAuth();

  const handleOnCLickSignUpButton = async () => {
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

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

      if (!passwordRegex.test(password)) {
        return alert(
          "Password must be at least 8 characters long and include uppercase, lowercase, number and special character.",
        );
      }
      if (!confirmPassword) return alert("Please confirm password!");
      if (confirmPassword !== password) return alert("Passwords do not match!");

      await register({
        name,
        email,
        password,
      });
      alert("user created");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Signup failed");
    }
  };

  return (
    <>
      <div class="login">
        <div class="loginSection">
          <div class="loginContainer">
            <div class="loginImgContainer">
              <img loading="lazy" src="./Images/9.jpg" class="loginImg" />
            </div>
            <div class="loginFormContainer">
              <div class="loginForm">
                <div class="div-6">Join Us</div>
                <div class="loginFormHeading">SIGN UP</div>
                <div class="loginFormSubHeadding">
                  Sign up to access your account
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
                <div class="loginFormText">Confirm Password</div>
                <input
                  class="loginFormInput"
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                ></input>
                <div style={{ marginTop: "20px" }}>
                  <div onClick={handleOnCLickSignUpButton}>
                    <ButtonDark text="Sign up" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
