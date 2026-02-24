import React, { useState } from "react";
import ButtonDark from "../Components/Common/ButtonDark";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

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
      <div className="login">
        <div className="loginSection">
          <div className="loginContainer">
            <div className="loginImgContainer">
              <img loading="lazy" src="./Images/9.jpg" className="loginImg" />
            </div>
            <div className="loginFormContainer">
              <div className="loginForm">
                <div className="div-6">Join Us</div>
                <div className="loginFormHeading">SIGN UP</div>
                <div className="loginFormSubHeadding">
                  Sign up to access your account
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
                <div className="loginFormText">Confirm Password</div>
                <input
                  className="loginFormInput"
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
