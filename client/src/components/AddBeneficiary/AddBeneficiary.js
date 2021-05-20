import React, { useState, useRef } from "react";
import {
  Grid,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  TextField,
  Button,
  Snackbar,
  SnackbarContent,
} from "@material-ui/core";
import Loader from "../../loader.gif";
import ErrorIcon from "@material-ui/icons/Error";
import "./AddBeneficiary.css";

const AddBeneficiary = ({ web3, dstnPoints, credManagerInst }) => {
  const [formdata, setFormdata] = useState({
    id: "",
    distnId: "",
    credentials: {
      image: "",
    },
  });

  const [errors, setErrors] = useState({
    id: "",
    distnId: "",
    credentials: {
      image: "",
    },
  });
  const [videoView, setVideoView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });

  const player = useRef(),
    canvas = useRef();

  const startStream = () => {
    setFormdata({
      ...formdata,
      credentials: {
        image: "",
      },
    });
    setVideoView(true);
    const constraints = {
      video: true,
      audio: false,
    };
    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      player.current.srcObject = stream;
    });
  };

  const captureImage = () => {
    const context = canvas.current.getContext("2d");
    // Draw the video frame to the canvas.
    context.drawImage(
      player.current,
      0,
      0,
      canvas.current.width,
      canvas.current.height
    );
    setVideoView(false);
    setFormdata({
      ...formdata,
      credentials: {
        image: canvas.current.toDataURL(),
      },
    });
    setErrors({
      ...errors,
      credentials: {
        image: "",
      },
    });
    player.current.srcObject &&
      player.current.srcObject.getTracks().forEach((track) => track.stop());
    player.current.srcObject = null;
  };

  const addBeneficiary = async () => {
    try {
      if (
        formdata.id.toString().length !== 12 ||
        formdata.distnId < 0 ||
        !formdata.credentials.image
      ) {
        console.log("errors");
        let idError = "",
          distnError = "",
          imageError = "";
        if (formdata.id.toString().length !== 12)
          idError = "Beneficiary id must be 12 characters long";

        if (!formdata.distnId)
          distnError = "Please select a distribution point";

        if (!formdata.credentials.image)
          imageError = "Beneficiary image is needed";

        setErrors({
          id: idError,
          distnId: distnError,
          credentials: {
            image: imageError,
          },
        });
        return;
      }
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const response = await fetch("http://localhost:5000/addBeneficiary", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formdata),
      });
      console.log(response);
      if (response.status === 200) {
        const responseData = await response.json();
        const txnResult = await credManagerInst.addBeneficiary(
          responseData.id,
          responseData.credentials,
          responseData.distnId,
          responseData.token,
          {
            from: accounts[0],
          }
        );
        console.log(txnResult);
        const _statusCode = parseInt(txnResult.logs[0].args._statusCode);
        if (_statusCode === 200) {
          setSuccessSnack({ view: true, msg: "Beneficiary Added succesfully" });
          console.log(200);
        } else if (_statusCode === 409) {
          setErrorSnack({
            view: true,
            msg: "Beneficiary alredy registered to the scheme",
          });
          console.log(409);
        } else if (_statusCode === 401) {
          setErrorSnack({
            view: true,
            msg: "You are unauthorized for this action",
          });
          console.log(401);
        } else if (_statusCode === 403)
          setErrorSnack({ view: true, msg: "Malicious txn request!" });
        console.log(responseData);
      } else if (response.status === 400) {
        setErrorSnack({ view: true, msg: "Invalid Beneficiary Data" });
      }
    } catch (err) {
      console.log(err);
    }
    setFormdata({
      id: "",
      distnId: "",
      credentials: {
        image: "",
      },
    });
    setLoading(false);
  };

  return loading ? (
    <img src={Loader} alt="loader" className="loader" />
  ) : (
    <>
      <Grid
        container
        alignItems="center"
        justify="center"
        className="addBeneficiary-container"
      >
        <Grid
          container
          item
          direction="column"
          alignItems="center"
          className="form-container"
        >
          <Grid item>
            <FormControl variant="filled">
              <TextField
                label="Beneficiary Id*"
                size="small"
                value={formdata.id}
                error={!errors.msg === ""}
                onChange={(e) => {
                  setFormdata({ ...formdata, id: e.target.value });
                  setErrors((prevErrors) => {
                    return {
                      ...prevErrors,
                      id: "",
                    };
                  });
                }}
              />
              <FormHelperText className="errorText">
                {errors.id === "" ? (
                  ""
                ) : (
                  <>
                    <ErrorIcon fontSize="small" />
                    &nbsp; {errors.id}
                  </>
                )}
              </FormHelperText>
            </FormControl>
            <br />
            <br />
          </Grid>
          <Grid item>
            <FormControl variant="filled">
              <InputLabel htmlFor="dpointsList">
                Distribution Point Id*
              </InputLabel>
              <Select
                error={!errors.distnId === ""}
                value={formdata.distnId}
                native
                onChange={(e) => {
                  setFormdata({ ...formdata, distnId: e.target.value });
                  setErrors((prevErrors) => {
                    return {
                      ...prevErrors,
                      distnId: "",
                    };
                  });
                }}
              >
                <option aria-label="None" value="" />
                {dstnPoints.map((dp, i) => (
                  <option value={dp.returnValues._id} key={i}>
                    {dp.returnValues._name}
                  </option>
                ))}
              </Select>
              <FormHelperText className="errorText">
                {errors.distnId === "" ? (
                  ""
                ) : (
                  <>
                    <ErrorIcon fontSize="small" />
                    &nbsp; {errors.distnId}
                  </>
                )}
              </FormHelperText>
            </FormControl>
            <br />
            <br />
          </Grid>

          <Grid item className={!videoView ? "display-none" : "center-align"}>
            <div className="mediaContainer">
              <video
                ref={player}
                autoPlay
                width="240"
                height="180"
                className="media"
              />
            </div>

            <br />
            <Button onClick={() => captureImage()} className="buttonSecondary">
              Capture
            </Button>
          </Grid>

          <Grid
            item
            className={
              !formdata.credentials.image ? "display-none" : "center-align"
            }
          >
            <div className="mediaContainer">
              <canvas ref={canvas} width="240" height="180" className="media" />
            </div>
            <br />
            <Button
              onClick={() => {
                setFormdata({ ...formdata, credentials: { image: "" } });
                startStream();
              }}
              className="buttonSecondary"
            >
              Retake
            </Button>
          </Grid>
          <Grid item>
            <FormHelperText className="errorText">
              {errors.credentials.image === "" ? (
                ""
              ) : (
                <>
                  <ErrorIcon fontSize="small" />
                  &nbsp; {errors.credentials.image}
                </>
              )}
            </FormHelperText>
          </Grid>
          <Grid item>
            <Button onClick={() => startStream()} className="buttonSecondary">
              Add Beneficiary Image
            </Button>
          </Grid>
          <Grid item>
            <Button
              onClick={() => addBeneficiary()}
              className="buttonSecondary"
            >
              Add Beneficiary
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Snackbar
        open={successSnack.view}
        autoHideDuration={6000}
        onClose={() =>
          setSuccessSnack({
            view: false,
            msg: "",
          })
        }
      >
        <SnackbarContent className="successSnack" message={successSnack.msg} />
      </Snackbar>
      <Snackbar
        open={errorSnack.view}
        autoHideDuration={6000}
        onClose={() =>
          setErrorSnack({
            view: false,
            msg: "",
          })
        }
      >
        <SnackbarContent className="errorSnack" message={errorSnack.msg} />
      </Snackbar>
    </>
  );
};

export default AddBeneficiary;
