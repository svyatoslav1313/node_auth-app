import { AlertCircle, ShieldCheck, CheckCircle } from "lucide-react";
import { useContext, useState } from "react";
import { UserContext } from "../../../context/UserContext";
import { AuthContext } from "../../../context/AuthContext";
import { Loader } from "../../../components/Loader/Loader";

export const EmailTab = () => {
  const { setUser } = useContext(AuthContext);
  const { updateEmail } = useContext(UserContext);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [serverResponse, setServerResponse] = useState('');

  return (
    <form
      className="profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const response = await updateEmail(newEmail, password);
          setServerResponse(response.message);
          setUser(response.user);
          // checkAuth();
        } catch (error) {
          setErrorMessage(error.response?.data?.message);
        }
      }}
    >
      <div className="profile-form__info-box">
        <ShieldCheck size={20} />
        <span>We will send a confirmation link to your new email address.</span>
      </div>
      <div className="profile-form__group">
        <label>New Email Address</label>
        <input
          type="text"
          value={newEmail}
          placeholder="new-email@example.com"
          onChange={(e) => setNewEmail(e.target.value)}
        />
      </div>
      <div className="profile-form__group">
        <label>Confirm with Password</label>
        <input
          type="password"
          value={password}
          placeholder="Enter current password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button className="profile-form__submit-button" type="submit">Request Email Change</button>
      {serverResponse && (
        <div className="profile-form__success-message">
          <CheckCircle size={18} />
          <span>{serverResponse}</span>
        </div>
      )}
      {errorMessage && (
        <div className="profile-form__error-message">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}
    </form>
  );
}