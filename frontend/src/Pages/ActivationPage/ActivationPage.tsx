import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Loader } from "../../components/Loader/Loader";
import { Navigate, useParams } from "react-router-dom";

export const ActivationPage = () => {
  const [isChecked, setChecked] = useState(false);
  const { activate } = useContext(AuthContext);
  const { activationToken } = useParams();

  useEffect(() => {
    activate(activationToken)
      .then(() => setChecked(true))
      .catch((error) => {
        console.error('Activation failed:', error);
      });
  }, []);

  if (!isChecked) {
    return <Loader />
  }

  return (
    <Navigate to='/profile/details' />
  )
}