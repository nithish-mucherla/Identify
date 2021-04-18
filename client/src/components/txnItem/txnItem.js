import React from "react";
import Identicon from "identicon.js";
import "./txnItem.css";
import { Grid } from "@material-ui/core";
function TxnItem(props) {
  const sentDate = new Date(parseInt(props.sent)).toLocaleString();
  const recvdDate =
    props.recvd === "0" ? 0 : new Date(parseInt(props.recvd)).toLocaleString();
  return (
    <Grid container alignItems="center" className="txnItem">
      <Grid item xs={2}>
        <img
          src={`data:image/png;base64,${new Identicon(
            props.txnId,
            30
          ).toString()}`}
          alt={props.txnId}
          className="identicon"
        />
      </Grid>
      <Grid container item direction="column" xs={10}>
        <Grid item>From Entity: {props.fromEntity}</Grid>
        <Grid item>To Entity: {props.toEntity}</Grid>
        <Grid item>
          Txn Initiator:
          <span title={props.initiator}>
            {props.initiator.substring(0, 13) +
              "..." +
              props.initiator.substring(23)}
          </span>
          <br /> Sent timestamp: {sentDate}
          <br /> Received timestamp: {recvdDate}
        </Grid>
        <Grid item>EntityLevel: {props.level}</Grid>
        <Grid item>txn Status: {props.statusCode}</Grid>
      </Grid>
    </Grid>
  );
}

export default TxnItem;
