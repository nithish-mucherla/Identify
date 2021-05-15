import React, { useEffect, useState } from "react";
import TruffleContract from "@truffle/contract";
import ResourcesContract from "../../contracts/Resources.json";
import InventoryContract from "../../contracts/Inventory.json";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import {
  Button,
  Checkbox,
  Grid,
  TextField,
  Snackbar,
  SnackbarContent,
} from "@material-ui/core";
import "./txnForm.css";
import Loader from "../../loader.gif";
import Nav from "../nav/nav.js";

export default function TxnForm(props) {
  const [resourceList, setResourceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    entityLevel: "",
    fromEntity: "",
    toEntity: "",
    resourceQuantities: [],
    checkedList: [],
    checkedCount: 0,
  });
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });
  const levels = ["Central", "State", "District", "Distn. Point"];
  const entities = [props.states, props.districts, props.dstnPoints];

  useEffect(() => {
    (async () => {
      const resourcesContract = TruffleContract(ResourcesContract);
      resourcesContract.setProvider(props.web3.currentProvider);
      const resourcesContractInstance = await resourcesContract.deployed();
      const _resourceList = await resourcesContractInstance.getResourceList();

      setResourceList(_resourceList);

      setForm((prevForm) => {
        const len = _resourceList.length;
        return {
          ...prevForm,
          resourceQuantities: new Array(len).fill(0),
          checkedList: new Array(len).fill(false),
        };
      });
    })();
  }, [props.web3]);

  const handleChainChange = () => {
    console.log("hi");
  };
  useEffect(() => {
    window.ethereum.addListener("chainChanged", handleChainChange);
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChange);
    };
  }, []);

  const handleCheckboxChange = (e, i) => {
    setForm((prevForm) => {
      let _checkList = prevForm.checkedList;
      _checkList[i] = !_checkList[i];
      if (_checkList[i]) prevForm.checkedCount += 1;
      else prevForm.checkedCount -= 1;
      return {
        ...prevForm,
        checkedList: _checkList,
      };
    });
  };

  const handleTransactionSubmit = () => {
    (async () => {
      setLoading(true);
      const inventoryContract = TruffleContract(InventoryContract);
      inventoryContract.setProvider(props.web3.currentProvider);
      const inventoryContractInstance = await inventoryContract.deployed();
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const level = levels[form.entityLevel];
      const fromEntityObject = JSON.parse(form.fromEntity);
      const fromEntityId =
        level === "Central" ? 0 : parseInt(fromEntityObject._id) - 1;
      const toEntityObject = JSON.parse(form.toEntity);
      const sentTimestamp = new Date().getTime();
      const recvdTimestamp = form.entityLevel === 3 ? sentTimestamp : 0;

      // console.log(
      //   accounts[0].slice(2) + "",
      //   level === "Distn. Point" ? "pass" : "",
      //   fromEntityObject._name,
      //   parseInt(fromEntityObject._id),
      //   toEntityObject._name,
      //   parseInt(toEntityObject._id),
      //   level,
      //   sentTimestamp,
      //   recvdTimestamp,
      //   form.resourceQuantities,
      //   props.credManagerInstance.address
      // );

      const txnResult = await inventoryContractInstance.sendTxn(
        accounts[0].slice(2),
        level === "Distn. Point" ? "pass" : "",
        fromEntityObject._name,
        fromEntityId,
        // fromEntityObject._id - id of the entity(Eg.: state id. state id of Telangana: 24)
        //fromEntityObject._id - 1 => index of the state in states[] of credentialManager contract (Eg.:23 for telangana )
        toEntityObject._name,
        parseInt(toEntityObject._id - 1),
        levels[form.entityLevel],
        sentTimestamp,
        recvdTimestamp,
        form.resourceQuantities,
        props.credManagerInstance.address,
        {
          from: accounts[0],
        }
      );

      setLoading(false);

      const txnId = txnResult.logs[0].args.txnId;
      const _statusCode = txnResult.logs[0].args.statusCode;

      console.log(_statusCode);

      if (_statusCode.toNumber() === 200)
        setSuccessSnack({
          view: true,
          msg: {
            txnId: txnId,
            txt: "Txn successful!",
          },
        });
      else if (_statusCode.toNumber() === 401)
        setErrorSnack({
          view: true,
          msg: `Unauthorized txn request.`,
        });
    })();
  };

  const handleEntityLevelChange = (e) => {
    const len = resourceList.length;
    setForm({
      entityLevel: e.target.value,
      fromEntity: "",
      toEntity: "",
      resourceQuantities: new Array(len).fill(0),
      checkedList: new Array(len).fill(false),
      checkedCount: 0,
    });
  };

  const FromEntityOptions = () => {
    const level = form.entityLevel;
    return (
      <>
        <option aria-label="None" value="" />
        {level === "0" ? (
          <option value={JSON.stringify({ _id: 0, _name: "Central" })}>
            Central
          </option>
        ) : (
          <>
            {entities[level - 1].map((entity, index) => {
              const id = entity.returnValues._id;
              const name = entity.returnValues._name;
              return (
                <option value={JSON.stringify(entity.returnValues)} key={id}>
                  {name}
                </option>
              );
            })}
          </>
        )}
      </>
    );
  };

  const ToEntityOptions = () => {
    const level = parseInt(form.entityLevel);
    if (level === 0)
      return (
        <>
          {entities[level].map((entity, index) => {
            const id = entity.returnValues._id;
            const name = entity.returnValues._name;
            return (
              <option value={JSON.stringify({ _id: id, _name: name })} key={id}>
                {name}
              </option>
            );
          })}
        </>
      );

    const toEntities = level !== 3 ? entities[level] : [];
    const fromEntity = form.fromEntity && JSON.parse(form.fromEntity);

    return (
      form.fromEntity &&
      toEntities.map((val, index) => {
        if (val.returnValues[2] === fromEntity._id) {
          const name = val.returnValues._name;
          const id = val.returnValues._id;
          return (
            <option value={JSON.stringify({ _id: id, _name: name })} key={id}>
              {name}
            </option>
          );
        } else return null;
      })
    );
  };

  const FromEntityFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="fromEntity">From Entity</InputLabel>
      <Select
        native
        value={form.fromEntity}
        name="fromEntity"
        id="fromEntity"
        onChange={(e) => {
          setForm({
            ...form,
            fromEntity: e.target.value,
          });
        }}
        error={false}
      >
        <FromEntityOptions />
      </Select>
    </FormControl>
  );

  const ToEntityFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="toEntity">To Entity</InputLabel>
      <Select
        native
        value={form.toEntity}
        name="toEntity"
        id="toEntity"
        onChange={(e) => {
          setForm({ ...form, toEntity: e.target.value });
        }}
        error={false}
      >
        <option aria-label="None" value="" />;
        <ToEntityOptions />
      </Select>
    </FormControl>
  );

  const CheckBoxContainer = () =>
    resourceList.map((item, i) => (
      <Grid key={i} item container className="checkBoxItem">
        <Grid item xs={1} sm={3} />
        <Grid item container xs={4} sm={2}>
          <FormControlLabel
            control={
              <Checkbox
                value={item}
                checked={form.checkedList[i]}
                onChange={(e) => handleCheckboxChange(e, i)}
              />
            }
            label={item}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          {form.checkedList[i] && (
            <TextField
              size="small"
              label={item === "money" ? "Rs" : "Kg"}
              type="number"
              value={form.resourceQuantities[i]}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prevForm) => {
                  let arr = prevForm.resourceQuantities;
                  arr[i] = prevForm.checkedList[i] ? val : 0;
                  return {
                    ...prevForm,
                    resourceQuantities: arr,
                  };
                });
              }}
            />
          )}
        </Grid>
        <Grid item xs={1} sm={3} />
      </Grid>
    ));

  const EntityLevelFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="toEntity">Level of Governance</InputLabel>
      <Select
        native
        value={form.entityLevel}
        name="entityLevel"
        onChange={(e) => {
          handleEntityLevelChange(e);
        }}
      >
        <option aria-label="None" value="" />
        {levels.map((level, index) => (
          <option value={index} key={index}>
            {level}
          </option>
        ))}
      </Select>
    </FormControl>
  );

  const copyToClipboard = async (data) => {
    await navigator.clipboard.writeText(data);
  };

  if (!loading)
    return (
      <>
        <Grid container direction="column" alignItems="center">
          <Grid item>
            <Nav setView={props.setView} />
          </Grid>
          <Grid
            item
            container
            className="txnFormContainer"
            direction="column"
            alignItems="center"
          >
            <Grid item>
              <EntityLevelFormControl /> <br /> <br />
            </Grid>
            {form.entityLevel && (
              <>
                <Grid item>
                  <FromEntityFormControl /> <br /> <br />
                </Grid>
                <Grid item>
                  <ToEntityFormControl /> <br /> <br />
                </Grid>
              </>
            )}
            {form.entityLevel && (
              <>
                <Grid item>
                  <br />
                  Select Resources
                </Grid>
                <Grid item container className="checkBoxContainer">
                  {CheckBoxContainer()}
                </Grid>
              </>
            )}
            <Grid item>
              <Button
                onClick={() => handleTransactionSubmit()}
                className="buttonPrimary"
              >
                send resources
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
          <SnackbarContent
            className="success"
            message={
              successSnack.msg.txt && (
                <span>
                  {successSnack.msg.txt} <br />
                  Txnid:{" "}
                  {successSnack.msg.txnId.substring(0, 10) +
                    "..." +
                    successSnack.msg.txnId.substring(56)}
                  <Button
                    className="buttonPrimary"
                    onClick={() => copyToClipboard(successSnack.msg.txnId)}
                  >
                    copy txnId
                  </Button>
                </span>
              )
            }
          />
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
          <SnackbarContent className="error" message={errorSnack.msg} />
        </Snackbar>
      </>
    );

  return <img src={Loader} alt="loader" className="loader" />;
}
