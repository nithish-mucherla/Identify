import React, { useState, useEffect, useCallback } from "react";
import RequestItem from "./RequestItem/RequestItem";
import Loader from "../../../loader.gif";
import { Grid } from "@material-ui/core";

const AuthRequests = ({ activeAuthority, credManagerInst, distnId }) => {
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);

  const getRequests = useCallback(async () => {
    setLoading(true);
    let requestList = await credManagerInst.getPastEvents(
      "BeneficiaryValidation",
      { fromBlock: 0, toBlock: "latest" },
      (err, event) => console.log(event)
    );
    let filteredList = {};

    requestList.reverse().forEach((req) => {
      const data = req.args;
      const _beneficiaryId = data._id;
      const txnStatus = data._statusCode.toNumber();
      if (
        data._dstnId.toNumber() === parseInt(distnId) &&
        txnStatus === 200 &&
        !filteredList[_beneficiaryId]
      ) {
        console.log(req);
        filteredList[_beneficiaryId] = req;
      }
    });
    setRequests(filteredList);
    setLoading(false);
  }, [credManagerInst, distnId]);
  useEffect(() => {
    getRequests();
  }, [getRequests]);

  return loading ? (
    <img src={Loader} alt="loader" />
  ) : (
    <Grid container direction="column">
      {Object.keys(requests).map((req, index) => {
        req = requests[req];
        const data = req.args;
        return (
          <RequestItem
            key={index}
            id={data._id.toNumber()}
            finalRegistrationStatus={data._finalStatus.toNumber()}
            authorityId={activeAuthority}
            approvedAuths={data._accepted}
            rejectedAuths={data._rejected}
            getRequests={getRequests}
            distnId={distnId}
            credManagerInst={credManagerInst}
            setLoading={setLoading}
          />
        );
      })}
    </Grid>
  );
};

export default AuthRequests;
