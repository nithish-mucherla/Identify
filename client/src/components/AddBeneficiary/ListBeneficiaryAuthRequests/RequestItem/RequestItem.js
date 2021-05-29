import React from "react";
import { Button, Chip, Grid, Paper } from "@material-ui/core";
import "./RequestItem.css";
import Identicon from "identicon.js";
const RequestItem = ({
  id,
  authorityId,
  distnId,
  finalRegistrationStatus,
  approvedAuths,
  getRequests,
  rejectedAuths,
  credManagerInst,
  setLoading,
}) => {
  let hasApproved, hasRejected;

  if (finalRegistrationStatus === 3) {
    hasApproved =
      approvedAuths.findIndex(
        (id) => id.toLowerCase() === authorityId.toLowerCase()
      ) >= 0;
    hasRejected =
      rejectedAuths.findIndex(
        (id) => id.toLowerCase() === authorityId.toLowerCase()
      ) >= 0;

    console.log(hasApproved, hasRejected);
  }

  const handleAuthorityAction = async (approvalStatus) => {
    setLoading(true);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const txnResult = await credManagerInst.authBeneficiary(
      id,
      parseInt(distnId),
      approvalStatus,
      {
        from: accounts[0],
      }
    );
    console.log(txnResult);
    await getRequests();
    setLoading(false);
  };

  const AuthorityAction = () => {};
  return (
    <Paper className="requestItemContainer">
      <Grid container alignItems="center" className="requestItem">
        <Grid container item direction="column" xs={12} sm={10}>
          <Grid item>
            <b>Beneficiary Id:</b>
            <br />
            {id}
          </Grid>
          <Grid item>
            {
              {
                1: (
                  <Chip
                    className="successChip"
                    label="Beneficiary Registered to the scheme!"
                  />
                ),
                2: <Chip className="errorChip" label="Beneficiary Rejected!" />,
              }[finalRegistrationStatus]
            }
          </Grid>
          {finalRegistrationStatus === 3 && (
            <>
              <Grid item>
                {!hasApproved && !hasRejected && (
                  <>
                    <Button
                      className="buttonError"
                      onClick={() => handleAuthorityAction(2)}
                    >
                      Reject
                    </Button>
                    <Button
                      className="buttonSuccess"
                      onClick={() => handleAuthorityAction(1)}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </Grid>
              <Grid item>
                {hasApproved && (
                  <Chip className="successChip" label="Approved!" />
                )}
              </Grid>
              <Grid item>
                {hasRejected && (
                  <Chip className="errorChip" label="Rejected!" />
                )}
              </Grid>
            </>
          )}
        </Grid>
        <Grid item xs={12} sm={2}>
          <img
            src={`data:image/png;base64,${new Identicon(
              `${id}:BeneficiaryId`,
              30
            ).toString()}`}
            alt={id}
            className="identifier"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RequestItem;
