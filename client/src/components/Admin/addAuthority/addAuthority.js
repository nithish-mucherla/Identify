import React, { useState } from "react";
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
import Loader from "../../../loader.gif";
import "./addAuthority.css";
import CredManager from "../../../contracts/CredentialManager.json";
import ErrorIcon from "@material-ui/icons/Error";

const AddAuthority = ({
  web3,
  states,
  districts,
  dstnPoints,
  credManagerInst,
  adminId,
}) => {
  const [entity, setEntity] = useState({
    level: "",
    id: "",
    authorityId: "",
    password: "",
  });
  const [error, setError] = useState({
    entityLevelSelect: false,
    entitySelect: false,
    authorityId: {
      isValid: true,
      errorMsg: "",
    },
    password: {
      isValid: true,
      errorMsg: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });

  const entities = {
    State: states,
    District: districts,
    "Distn. Point": dstnPoints,
  }[entity.level];

  const isValidId = (id) => {
    try {
      if (entity.level === "Distn. Point") {
        let errorMsg = "",
          valid = true;
        if (id.trim().length < 4) {
          valid = false;
          errorMsg = "Id must be atleast 4 characters long!";
        }
        setError({
          ...error,
          authorityId: {
            isValid: valid,
            errorMsg: errorMsg,
          },
        });
      } else {
        const address = web3.utils.toChecksumAddress("0x" + id.trim());
        setError({
          ...error,
          authorityId: {
            isValid: true,
            errorMsg: "",
          },
        });
      }
    } catch (e) {
      setError({
        ...error,
        authorityId: {
          isValid: false,
          errorMsg: "Invalid Authority Id",
        },
      });
    }
  };

  const isValidPassword = (pass) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    return regex.test(pass);
  };

  const addAuthority = async () => {
    setLoading(true);
    try {
      let credManagerInstance = new web3.eth.Contract(
        CredManager.abi,
        credManagerInst.address
      );
      if (
        !error.entityLevelSelect &&
        !error.entitySelect &&
        error.authorityId.isValid
      ) {
        let txnResult;

        if (entity.level === "Distn. Point")
          txnResult = await credManagerInstance.methods
            .addAuthority(
              {
                State: 1,
                District: 2,
                "Distn. Point": 3,
              }[entity.level],
              parseInt(entity.id),
              entity.authorityId,
              entity.password
            )
            .send({
              from: adminId,
            });
        else
          txnResult = await credManagerInstance.methods
            .addAuthority(
              {
                State: 1,
                District: 2,
                "Distn. Point": 3,
              }[entity.level],
              parseInt(entity.id),
              entity.authorityId.toLowerCase()
            )
            .send({
              from: adminId,
            });

        console.log(
          {
            State: 1,
            District: 2,
            "Distn. Point": 3,
          }[entity.level],
          parseInt(entity.id),
          "0x" + entity.authorityId
        );
        setEntity({
          level: "",
          id: "",
          authorityId: "",
          password: "",
        });
        setSuccessSnack({
          view: true,
          msg: "Authority added succesfully",
        });
      }
    } catch (e) {
      setErrorSnack({
        view: true,
        msg: "Error adding authority! Please try again later",
      });
    }
    setLoading(false);
  };

  const checkAuthority = async () => {
    let txnResult;
    if (entity.level === "Distn. Point")
      txnResult = await credManagerInst.authorizeSigner(
        entity.level,
        entity.authorityId,
        parseInt(entity.id),
        entity.password
      );
    else
      txnResult = await credManagerInst.authorizeSigner(
        entity.level,
        entity.authorityId.toLowerCase(),
        parseInt(entity.id)
      );

    alert(txnResult);
  };
  return (
    <Grid container direction="column" alignItems="center">
      {loading ? (
        <Grid item>
          <img src={Loader} alt="loading" />
        </Grid>
      ) : (
        <>
          <Grid container direction="column">
            <Grid item>
              <FormControl variant="filled">
                <InputLabel htmlFor="entityLevel">Entity Level*</InputLabel>
                <Select
                  native
                  value={entity.level}
                  name="entityLevel"
                  id="entityLevel"
                  onChange={(e) => {
                    setEntity({
                      ...entity,
                      id: "",
                      level: e.target.value,
                    });
                    setError({
                      ...error,
                      entityLevelSelect: e.target.value === "",
                    });
                  }}
                  error={error.entityLevelSelect}
                >
                  <option aria-label="None" value="" />
                  <option value="State">State</option>
                  <option value="District">District</option>
                  <option value="Distn. Point">Distn. Point</option>
                </Select>
                <FormHelperText className="errorText">
                  {error.entityLevelSelect ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp; Valid Entity level
                      must be selected
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item>
              <br />
              <FormControl variant="filled">
                <InputLabel htmlFor="entityId">
                  Select {entity.level ? entity.level : "Entity"}*
                </InputLabel>
                <Select
                  native
                  value={entity.id}
                  name="entityId"
                  id="entityId"
                  onChange={(e) => {
                    setEntity({
                      ...entity,
                      id: e.target.value,
                    });
                    setError({
                      ...error,
                      entitySelect: e.target.value === "",
                    });
                  }}
                  error={error.entitySelect}
                >
                  <option aria-label="None" value="" />
                  {entity.level &&
                    entities.map((e, i) => (
                      <option value={parseInt(e.returnValues._id) - 1} key={i}>
                        {e.returnValues._name}
                      </option>
                    ))}
                </Select>
                <FormHelperText className="errorText">
                  {error.entitySelect ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp; Valid {entity.level}{" "}
                      must be selected
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item>
              <br />
              <FormControl>
                <TextField
                  size="small"
                  label="Authority Id*"
                  value={entity.authorityId}
                  error={!error.authorityId.isValid}
                  onChange={(e) => {
                    setEntity({ ...entity, authorityId: e.target.value });
                    isValidId(e.target.value);
                  }}
                />
                <FormHelperText className="errorText">
                  {error.authorityId.errorMsg ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp;{" "}
                      {error.authorityId.errorMsg}
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            {entity.level === "Distn. Point" && (
              <Grid item>
                <br />
                <FormControl>
                  <TextField
                    size="small"
                    label="Password*"
                    type="password"
                    value={entity.password}
                    error={!error.password.isValid}
                    onChange={(e) => {
                      let passwordValidity = isValidPassword(e.target.value);
                      setEntity({ ...entity, password: e.target.value });
                      setError({
                        ...error,
                        password: {
                          isValid: passwordValidity,
                          errorMsg: passwordValidity
                            ? ""
                            : "Password Requirements: length must be between 5 and 17 characters. Atleast 1 spcl character and a number",
                        },
                      });
                    }}
                  />
                  <FormHelperText className="errorText">
                    {error.password.errorMsg ? (
                      <>
                        <ErrorIcon fontSize="small" /> &nbsp;{" "}
                        {error.password.errorMsg}
                      </>
                    ) : (
                      ""
                    )}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
          </Grid>
          <Grid
            container
            direction="column"
            alignItems="flex-end"
            justify="center"
            className="buttonGroup"
          >
            <Grid item>
              <Button
                className="buttonSecondary"
                onClick={() => addAuthority()}
              >
                Add
              </Button>
            </Grid>
            <Grid item>
              <Button
                className="buttonSecondary"
                onClick={() => checkAuthority()}
              >
                Verify Authorization
              </Button>
            </Grid>
          </Grid>
        </>
      )}

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
    </Grid>
  );
};

export default AddAuthority;
