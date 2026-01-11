import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { BottomWarning } from "../components/BottomWarning"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"
import { InputBox } from "../components/InputBox"
import { SubHeading } from "../components/SubHeading"

export const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:3000/api/v1/user/signup", {
        firstName,
        lastName,
        username,
        password
      });
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-300 h-screen flex justify-center">
      <div className="flex flex-col justify-center">
        <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
          <Heading label={"Sign up"} />
          <SubHeading label={"Enter your information to create an account"} />
          <InputBox
            placeholder="John"
            label={"First Name"}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <InputBox
            placeholder="Doe"
            label={"Last Name"}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <InputBox
            placeholder="harkirat@gmail.com"
            label={"Email"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <InputBox
            placeholder="123456"
            label={"Password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
          <div className="pt-4">
            <Button
              label={loading ? "Signing up..." : "Sign up"}
              onClick={handleSignup}
            />
          </div>
          <BottomWarning label={"Already have an account?"} buttonText={"Sign in"} to={"/signin"} />
        </div>
      </div>
    </div>
  );
}
